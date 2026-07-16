import "./SettingsPage.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { useState } from "react";
import { USER_NAME_KEY } from "../../shared/userSettings";
import { ContentApi } from "../../shared/contentApi";
import { clearVocabularyCache } from "../../shared/useVocabulary";
import { clearDialoguesCache } from "../../shared/useDialogues";

const STORAGE = {
  NAME: USER_NAME_KEY,
  HSK: "listening-app:hsk-level",
  GOAL: "listening-app:daily-goal",
  RATE: "listening-app:playback-rate",
  PINYIN: "listening-app:show-pinyin",
};

export default function SettingsPage() {
  const { t, language, setLanguage, languages } = useLanguage();

  const [name, setName] = useState(localStorage.getItem(STORAGE.NAME) || "");
  const [hsk, setHsk] = useState(localStorage.getItem(STORAGE.HSK) || "1");
  const [goal, setGoal] = useState(() => {
    const v = localStorage.getItem(STORAGE.GOAL);
    return v ? parseInt(v, 10) : 10;
  });
  const [rate, setRate] = useState(() => {
    const v = localStorage.getItem(STORAGE.RATE);
    return v ? parseFloat(v) : 1.0;
  });
  const [pinyin, setPinyin] = useState(() => {
    return localStorage.getItem(STORAGE.PINYIN) === "true";
  });

  const handleName = (e) => {
    const val = e.target.value;
    setName(val);
    localStorage.setItem(STORAGE.NAME, val);
  };
  const handleHsk = (e) => {
    const val = e.target.value;
    setHsk(val);
    localStorage.setItem(STORAGE.HSK, val);
  };
  const handleGoal = (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    setGoal(val);
    localStorage.setItem(STORAGE.GOAL, String(val));
  };
  const handleRate = (e) => {
    const val = parseFloat(e.target.value);
    setRate(val);
    localStorage.setItem(STORAGE.RATE, String(val));
  };
  const handlePinyin = (e) => {
    const val = e.target.checked;
    setPinyin(val);
    localStorage.setItem(STORAGE.PINYIN, String(val));
  };

  const [refreshState, setRefreshState] = useState({ status: "idle", message: "" });

  const handleRefreshContent = async () => {
    setRefreshState({ status: "loading", message: "" });
    try {
      const result = await ContentApi.refreshContent();
      clearVocabularyCache();
      clearDialoguesCache();
      const wordCount = Object.values(result.vocabulary).reduce((a, b) => a + b, 0);
      setRefreshState({
        status: "success",
        message: `Đã cập nhật ${wordCount} từ vựng và ${result.dialogues} hội thoại.`,
      });
    } catch (err) {
      setRefreshState({ status: "error", message: err.message });
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>{t("settings.title")}</h1>
        <p>{t("settings.description")}</p>
      </div>

      {/* Ngôn ngữ – giữ nguyên */}
      <section className="settings-card">
        <h2>{t("settings.languageLabel")}</h2>
        <p className="settings-card-desc">{t("settings.languageDescription")}</p>
        <div className="language-options" role="radiogroup">
          {languages.map((option) => (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={option.code === language}
              className={`language-option${option.code === language ? " active" : ""}`}
              onClick={() => setLanguage(option.code)}
            >
              <span className="language-option-flag">{option.flag}</span>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Thông tin cá nhân – grid 2 cột */}
      <section className="settings-card">
        <h2>Thông tin cá nhân</h2>
        <div className="settings-grid">
          <div className="settings-field">
            <label htmlFor="name">Tên</label>
            <input id="name" type="text" value={name} onChange={handleName} placeholder="Nhập tên" />
          </div>
          <div className="settings-field">
            <label htmlFor="hsk">Trình độ HSK</label>
            <select id="hsk" value={hsk} onChange={handleHsk}>
              <option value="1">HSK 1</option>
              <option value="2">HSK 2</option>
              <option value="3">HSK 3</option>
              <option value="4">HSK 4</option>
              <option value="5">HSK 5</option>
              <option value="6">HSK 6</option>
              <option value="7-9">HSK 7-9</option>
            </select>
          </div>
        </div>
      </section>

      {/* Cài đặt học tập – grid 2 cột, checkbox chiếm cả 2 */}
      <section className="settings-card">
        <h2>Cài đặt học tập</h2>
        <div className="settings-grid">
          <div className="settings-field">
            <label htmlFor="goal">Mục tiêu từ vựng/ngày</label>
            <input id="goal" type="number" min="0" value={goal} onChange={handleGoal} />
          </div>
          <div className="settings-field">
            <label htmlFor="rate">Tốc độ phát âm</label>
            <select id="rate" value={rate} onChange={handleRate}>
              <option value="0.8">0.8x</option>
              <option value="1.0">1.0x</option>
              <option value="1.2">1.2x</option>
            </select>
          </div>
          <div className="settings-field checkbox">
            <label>
              <input type="checkbox" checked={pinyin} onChange={handlePinyin} />
              Hiển thị pinyin
            </label>
          </div>
        </div>
      </section>

      {/* Dữ liệu học tập – tải lại từ vựng/hội thoại mới nhất từ GitHub */}
      <section className="settings-card">
        <h2>Dữ liệu học tập</h2>
        <p className="settings-card-desc">
          Tải lại từ vựng và hội thoại mới nhất (nếu có cập nhật trên GitHub).
        </p>
        <button
          type="button"
          className="btn-accent"
          onClick={handleRefreshContent}
          disabled={refreshState.status === "loading"}
        >
          {refreshState.status === "loading" ? "Đang cập nhật..." : "Cập nhật dữ liệu"}
        </button>
        {refreshState.status === "success" && (
          <p className="settings-refresh-message success">{refreshState.message}</p>
        )}
        {refreshState.status === "error" && (
          <p className="settings-refresh-message error">{refreshState.message}</p>
        )}
      </section>
    </div>
  );
}