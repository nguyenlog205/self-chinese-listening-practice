import { useLanguage } from "../../../i18n/LanguageContext";
import { getWordsDone, getSentencesDone } from "../../../shared/localProgress";
import { getWordGoal, getSentenceGoal } from "../../../shared/userSettings";

function pct(done, goal) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((done / goal) * 100));
}

export default function ProgressGoalsCard() {
  const { t } = useLanguage();
  const wordsDone = getWordsDone();
  const sentencesDone = getSentencesDone();
  const wordGoal = getWordGoal();
  const sentenceGoal = getSentenceGoal();
  const wordPct = pct(wordsDone, wordGoal);
  const sentencePct = pct(sentencesDone, sentenceGoal);

  return (
    <div className="progress-card">
      <h3>{t("home.progress.title")}</h3>

      <div className="progress-sentences-heard">
        <span className="progress-sentences-count">{sentencesDone}</span>
        <span>{t("home.progress.sentencesHeard")}</span>
      </div>

      <div className="progress-goal-row">
        <div className="progress-goal-label">
          <span>{t("home.progress.words")}</span>
          <span>
            {wordsDone}/{wordGoal} ({wordPct}%)
          </span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill words" style={{ width: `${wordPct}%` }} />
        </div>
      </div>

      <div className="progress-goal-row">
        <div className="progress-goal-label">
          <span>{t("home.progress.sentences")}</span>
          <span>
            {sentencesDone}/{sentenceGoal} ({sentencePct}%)
          </span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill sentences" style={{ width: `${sentencePct}%` }} />
        </div>
      </div>
    </div>
  );
}
