import { apiBase, apiFetch, wsBase } from "../../shared/api";

export const Api = {
  base: apiBase,
  listLessons: () => apiFetch("/api/lessons"),
  addLesson: (url) =>
    apiFetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }),
  getLesson: (id) => apiFetch(`/api/lessons/${encodeURIComponent(id)}`),
  getSegments: (id) => apiFetch(`/api/lessons/${encodeURIComponent(id)}/segments`),
  markPracticed: (id) =>
    apiFetch(`/api/lessons/${encodeURIComponent(id)}/practiced`, { method: "POST" }),
  deleteLesson: (id) =>
    apiFetch(`/api/lessons/${encodeURIComponent(id)}`, { method: "DELETE" }),
  mediaVideoUrl: async (id) => `${await apiBase()}/media/video/${encodeURIComponent(id)}.mp4`,
  jobSocket: async (id, onEvent) => {
    const base = await wsBase();
    const ws = new WebSocket(`${base}/ws/jobs/${encodeURIComponent(id)}`);
    ws.onmessage = (msg) => onEvent(JSON.parse(msg.data));
    return ws;
  },
};

export const STAGE_LABELS = {
  queued: { vi: "Đang chờ", en: "Queued", zh: "排队中" },
  metadata: { vi: "Đang lấy thông tin", en: "Fetching metadata", zh: "获取信息中" },
  video: { vi: "Đang tải video", en: "Downloading video", zh: "下载视频中" },
  audio: { vi: "Đang xử lý âm thanh", en: "Processing audio", zh: "处理音频中" },
  transcribing: { vi: "Đang nhận diện giọng nói", en: "Transcribing", zh: "识别语音中" },
  segmenting: { vi: "Đang chia câu", en: "Segmenting", zh: "分句中" },
  done: { vi: "Hoàn tất", en: "Done", zh: "完成" },
  error: { vi: "Lỗi", en: "Error", zh: "错误" },
};
