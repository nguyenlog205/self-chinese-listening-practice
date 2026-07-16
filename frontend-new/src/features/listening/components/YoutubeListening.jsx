import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { Api, STAGE_LABELS } from "../api";

const TERMINAL = new Set(["ready", "error"]);

export default function YoutubeListening() {
  const { t, language } = useLanguage();
  const [lessons, setLessons] = useState([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [dictationOn, setDictationOn] = useState(false);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  const socketsRef = useRef(new Map());
  const videoRef = useRef(null);
  const boundaryTimerRef = useRef(null);

  const refreshLessons = () => {
    Api.listLessons()
      .then((rows) => {
        setLessons(rows);
        setError(null);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    refreshLessons();
    const sockets = socketsRef.current;
    return () => {
      sockets.forEach((ws) => ws.close());
      sockets.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lessons.forEach((lesson) => {
      if (TERMINAL.has(lesson.status) || socketsRef.current.has(lesson.id)) return;
      Api.jobSocket(lesson.id, (evt) => {
        refreshLessons();
        if (TERMINAL.has(evt.status)) {
          socketsRef.current.get(lesson.id)?.close();
          socketsRef.current.delete(lesson.id);
        }
      }).then((ws) => socketsRef.current.set(lesson.id, ws));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons]);

  const submitLesson = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    Api.addLesson(url.trim())
      .then(() => {
        setUrl("");
        refreshLessons();
      })
      .catch((err) => setError(err.message));
  };

  const openLesson = (lesson) => {
    if (lesson.status !== "ready") return;
    setSelectedId(lesson.id);
    setCurrentIndex(0);
    setChecked(false);
    setGuess("");
    Api.getSegments(lesson.id)
      .then(setSegments)
      .catch((err) => setError(err.message));
    Api.mediaVideoUrl(lesson.id).then(setVideoSrc);
  };

  const closeLesson = () => {
    setSelectedId(null);
    setSegments([]);
    setVideoSrc(null);
    if (boundaryTimerRef.current) clearInterval(boundaryTimerRef.current);
  };

  const removeLesson = (id, e) => {
    e.stopPropagation();
    Api.deleteLesson(id)
      .then(() => {
        if (selectedId === id) closeLesson();
        refreshLessons();
      })
      .catch((err) => setError(err.message));
  };

  const segment = segments[currentIndex];

  const playSegment = () => {
    const video = videoRef.current;
    if (!video || !segment) return;
    if (boundaryTimerRef.current) clearInterval(boundaryTimerRef.current);
    video.currentTime = segment.start_sec;
    video.play();
    boundaryTimerRef.current = setInterval(() => {
      if (video.currentTime >= segment.end_sec) {
        video.pause();
        clearInterval(boundaryTimerRef.current);
      }
    }, 200);
  };

  const goTo = (index) => {
    if (index < 0 || index >= segments.length) return;
    setCurrentIndex(index);
    setChecked(false);
    setGuess("");
    if (index === segments.length - 1) {
      Api.markPracticed(selectedId).catch(() => {});
    }
  };

  const checkDictation = () => {
    setChecked(true);
  };

  const diff = useMemo(() => {
    if (!segment) return [];
    const target = segment.text_zh;
    return target.split("").map((ch, i) => ({ ch, ok: guess[i] === ch }));
  }, [segment, guess]);

  const selectedLesson = lessons.find((l) => l.id === selectedId);

  if (selectedId && selectedLesson) {
    return (
      <div className="listening-panel">
        <button type="button" className="listening-back-btn" onClick={closeLesson}>
          ← {t("listening.youtube.backToLibrary")}
        </button>

        {videoSrc && (
          <video
            ref={videoRef}
            className="listening-practice-video"
            src={videoSrc}
            controls
          />
        )}

        {segment && (
          <div className="listening-card">
            <button type="button" className="listening-play-btn" onClick={playSegment}>
              🔊 {t("listening.youtube.playSegment")}
            </button>

            {showText && <p className="listening-practice-text">{segment.text_zh}</p>}
            {showPinyin && <p className="listening-practice-pinyin">{segment.pinyin}</p>}

            <div className="listening-toggle-row">
              <label>
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
                {t("listening.youtube.showText")}
              </label>
              <label>
                <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
                {t("listening.youtube.showPinyin")}
              </label>
              <label>
                <input type="checkbox" checked={dictationOn} onChange={(e) => setDictationOn(e.target.checked)} />
                {t("listening.youtube.dictationMode")}
              </label>
            </div>

            {dictationOn && (
              <div className="listening-toggle-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <input
                  type="text"
                  className="listening-search"
                  placeholder={t("hsk.listening.inputPlaceholder")}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkDictation()}
                />
                <button type="button" className="btn-accent" onClick={checkDictation} style={{ alignSelf: "flex-start", marginTop: 8 }}>
                  {t("hsk.common.check")}
                </button>
                {checked && (
                  <p className="listening-practice-text" style={{ marginTop: 8 }}>
                    {diff.map((d, i) => (
                      <span key={i} style={{ color: d.ok ? "var(--accent-2)" : "var(--accent)" }}>
                        {d.ch}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}

            <div className="listening-footer">
              <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                ← {t("hsk.common.prev")}
              </button>
              <span className="listening-progress-label">
                {currentIndex + 1}/{segments.length}
              </span>
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex >= segments.length - 1}
              >
                {t("hsk.common.next")} →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="listening-panel">
      {error && <p className="listening-banner">{error}</p>}

      <form className="listening-toggle-row" onSubmit={submitLesson} style={{ gap: 10 }}>
        <input
          type="text"
          className="listening-search"
          placeholder={t("home.addPlaceholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" className="btn-accent">
          {t("home.addButton")}
        </button>
      </form>

      <div className="listening-lesson-list">
        {lessons.length === 0 && <p className="listening-progress-label">{t("home.emptyText")}</p>}
        {lessons.map((lesson) => {
          const stageLabel = STAGE_LABELS[lesson.stage]?.[language] ?? lesson.stage;
          return (
            <div key={lesson.id} className="listening-lesson-card" onClick={() => openLesson(lesson)}>
              <div>
                <div className="listening-lesson-title">{lesson.title || lesson.id}</div>
                <div className="listening-lesson-meta">
                  {lesson.status === "ready"
                    ? `${lesson.segment_count} ${t("listening.youtube.segments")}`
                    : stageLabel}
                </div>
              </div>
              {lesson.status !== "ready" && lesson.status !== "error" && (
                <div className="listening-lesson-progress">
                  <div
                    className="listening-lesson-progress-bar"
                    style={{ width: `${lesson.progress_pct}%` }}
                  />
                </div>
              )}
              <button
                type="button"
                className="listening-lesson-delete"
                onClick={(e) => removeLesson(lesson.id, e)}
                title={t("listening.youtube.delete")}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
