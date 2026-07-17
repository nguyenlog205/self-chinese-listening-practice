import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserName } from "../../shared/userSettings";
import { useLessons } from "../../shared/useLessons";
import { STAGE_LABELS } from "../../shared/lessonsApi";
import StreakCard from "./components/StreakCard";
import DailyActivityChart from "./components/DailyActivityChart";
import ExamCountdownCard from "./components/ExamCountdownCard";
import ProgressGoalsCard from "./components/ProgressGoalsCard";

export default function HomePage() {
  const { t, language } = useLanguage();
  const name = getUserName();
  const navigate = useNavigate();
  const { lessons, error, addLesson, deleteLesson } = useLessons();
  const [url, setUrl] = useState("");

  const submitLesson = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    addLesson(url.trim())
      .then(() => setUrl(""))
      .catch(() => {});
  };

  const openLesson = (lesson) => {
    if (lesson.status !== "ready") return;
    navigate("/listening");
  };

  const removeLesson = (id, e) => {
    e.stopPropagation();
    deleteLesson(id).catch(() => {});
  };

  return (
    <div className="home-layout">
      <div className="home">
        <section className="home-hero">
          <span className="home-eyebrow">{t("home.eyebrow")}</span>
          <h1>{name ? t("home.titleWithName", { name }) : t("home.title")}</h1>
          <p>{t("home.description")}</p>
        </section>

        <section className="home-add-card">
          <h2>{t("home.addTitle")}</h2>
          {error && <p className="listening-banner">{error}</p>}
          <form className="home-add-row" onSubmit={submitLesson}>
            <input
              type="text"
              placeholder={t("home.addPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button className="btn-accent" type="submit">
              {t("home.addButton")}
            </button>
          </form>
        </section>

        <section className="home-library">
          <h2>{t("home.libraryTitle")}</h2>
          {lessons.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-mark">卷</div>
              <p>{t("home.emptyText")}</p>
            </div>
          ) : (
            <div className="listening-lesson-list">
              {lessons.map((lesson) => {
                const stageLabel = STAGE_LABELS[lesson.stage]?.[language] ?? lesson.stage;
                return (
                  <div
                    key={lesson.id}
                    className="listening-lesson-card"
                    onClick={() => openLesson(lesson)}
                  >
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
          )}
        </section>
      </div>

      <aside className="home-side">
        <StreakCard />
        <ProgressGoalsCard />
        <DailyActivityChart />
        <ExamCountdownCard />
      </aside>
    </div>
  );
}
