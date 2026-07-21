#!/usr/bin/env python3
"""Model adapters for STT benchmarking. Each adapter exposes load(), transcribe(), unload()."""

import os
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "models"


class BaseAdapter:
    key = None
    checkpoint = None
    cache_dir = None

    def load(self):
        raise NotImplementedError

    def transcribe(self, audio_path: str) -> str:
        raise NotImplementedError

    def unload(self):
        pass

    def size_scope_dir(self) -> Path:
        # Directory to measure for model_size_mb(). Defaults to the whole
        # cache_dir, but adapters sharing a cache_dir with other models
        # (e.g. multiple HF checkpoints under the same HF_HOME) must override
        # this to point at their own model-specific subfolder, otherwise the
        # measured size would include unrelated models' weights too.
        return self.cache_dir

    def model_size_mb(self) -> float:
        scope_dir = self.size_scope_dir()
        if not scope_dir or not scope_dir.exists():
            return 0.0
        # HF/modelscope caches use symlinks (snapshots/ -> blobs/), so dedupe by
        # inode to avoid counting the same underlying file twice.
        seen_inodes = set()
        total = 0
        for f in scope_dir.rglob("*"):
            if not f.is_file():
                continue
            st = f.stat()
            if st.st_ino in seen_inodes:
                continue
            seen_inodes.add(st.st_ino)
            total += st.st_size
        return round(total / (1024 * 1024), 2)


class FasterWhisperAdapter(BaseAdapter):
    key = "faster-whisper-small"
    checkpoint = "Systran/faster-whisper-small"

    def __init__(self):
        self.cache_dir = MODELS_DIR / "faster-whisper"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.model = None

    def load(self):
        from faster_whisper import WhisperModel

        self.model = WhisperModel(
            self.checkpoint,
            device="cpu",
            compute_type="int8",
            download_root=str(self.cache_dir),
        )

    def transcribe(self, audio_path: str) -> str:
        segments, _ = self.model.transcribe(audio_path, language="zh", beam_size=1)
        return "".join(seg.text for seg in segments).strip()

    def unload(self):
        self.model = None


class SenseVoiceAdapter(BaseAdapter):
    key = "sensevoice-small"
    checkpoint = "iic/SenseVoiceSmall"

    def __init__(self):
        self.cache_dir = MODELS_DIR / "modelscope"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        os.environ["MODELSCOPE_CACHE"] = str(self.cache_dir)
        self.model = None

    def load(self):
        from funasr import AutoModel

        self.model = AutoModel(
            model=self.checkpoint,
            device="cpu",
            disable_update=True,
            hub="ms",
        )

    def transcribe(self, audio_path: str) -> str:
        result = self.model.generate(
            input=audio_path,
            cache={},
            language="zh",
            use_itn=True,
        )
        text = result[0]["text"] if result else ""
        # SenseVoice output includes markup tags like <|zh|><|NEUTRAL|>... strip them
        import re
        text = re.sub(r"<\|[^|]*\|>", "", text)
        return text.strip()

    def unload(self):
        self.model = None


def _hf_cache_subdir(cache_dir: Path, checkpoint: str) -> Path:
    org, name = checkpoint.split("/", 1)
    return cache_dir / f"models--{org}--{name}"


class Wav2Vec2XLSRAdapter(BaseAdapter):
    key = "wav2vec2-xlsr-53-chinese"
    checkpoint = "jonatasgrosman/wav2vec2-large-xlsr-53-chinese-zh-cn"

    def __init__(self):
        self.cache_dir = MODELS_DIR / "hf"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(self.cache_dir)
        self.model = None
        self.processor = None

    def size_scope_dir(self) -> Path:
        return _hf_cache_subdir(self.cache_dir, self.checkpoint)

    def load(self):
        import torch
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

        self.processor = Wav2Vec2Processor.from_pretrained(
            self.checkpoint, cache_dir=str(self.cache_dir)
        )
        self.model = Wav2Vec2ForCTC.from_pretrained(
            self.checkpoint, cache_dir=str(self.cache_dir)
        )
        self.model.eval()
        self.torch = torch

    def transcribe(self, audio_path: str) -> str:
        import soundfile as sf

        audio, sr = sf.read(audio_path, dtype="float32")
        inputs = self.processor(audio, sampling_rate=sr, return_tensors="pt", padding=True)
        with self.torch.no_grad():
            logits = self.model(inputs.input_values).logits
        pred_ids = self.torch.argmax(logits, dim=-1)
        text = self.processor.batch_decode(pred_ids)[0]
        return text.replace(" ", "").strip()

    def unload(self):
        self.model = None
        self.processor = None


class Wav2Vec2WenetSpeechAdapter(BaseAdapter):
    # TencentGameMate/chinese-wav2vec2-base has no CTC head/vocab (pretrain-only
    # backbone, not usable for direct transcription). Swapped to a different
    # ASR-ready checkpoint: same wav2vec2-large architecture as category 3, but
    # different training lineage (WenetSpeech-trained vs XLSR-53 multilingual
    # pretrain + CommonVoice fine-tune), different vocab/tokenizer.
    key = "wav2vec2-large-wenetspeech"
    checkpoint = "wbbbbb/wav2vec2-large-chinese-zh-cn"

    def __init__(self):
        self.cache_dir = MODELS_DIR / "hf"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        os.environ["HF_HOME"] = str(self.cache_dir)
        self.model = None
        self.processor = None

    def size_scope_dir(self) -> Path:
        return _hf_cache_subdir(self.cache_dir, self.checkpoint)

    def load(self):
        import torch
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

        self.processor = Wav2Vec2Processor.from_pretrained(
            self.checkpoint, cache_dir=str(self.cache_dir)
        )
        self.model = Wav2Vec2ForCTC.from_pretrained(
            self.checkpoint, cache_dir=str(self.cache_dir)
        )
        self.model.eval()
        self.torch = torch

    def transcribe(self, audio_path: str) -> str:
        import soundfile as sf

        audio, sr = sf.read(audio_path, dtype="float32")
        inputs = self.processor(audio, sampling_rate=sr, return_tensors="pt", padding=True)
        with self.torch.no_grad():
            logits = self.model(inputs.input_values).logits
        pred_ids = self.torch.argmax(logits, dim=-1)
        text = self.processor.batch_decode(pred_ids)[0]
        return text.replace(" ", "").strip()

    def unload(self):
        self.model = None
        self.processor = None


REGISTRY = {
    FasterWhisperAdapter.key: FasterWhisperAdapter,
    SenseVoiceAdapter.key: SenseVoiceAdapter,
    Wav2Vec2XLSRAdapter.key: Wav2Vec2XLSRAdapter,
    Wav2Vec2WenetSpeechAdapter.key: Wav2Vec2WenetSpeechAdapter,
}
