// Standalone i18n for the marketing site. Plain JS, no build step, no
// dependency on frontend/'s i18n system (this folder stays independent).
// vi is the source of truth; en/zh (Simplified) are hand-translated; zh-TW
// was generated once from zh via opencc-js (same tool used for the app's
// own zh-TW strings), then hand-checked, not hand-maintained separately.
const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "Tiếng Việt" },
  { code: "en", label: "English", flag: "English" },
  { code: "zh", label: "简体中文", flag: "简体中文" },
  { code: "zh-TW", label: "繁體中文", flag: "繁體中文" },
];
const DEFAULT_LANGUAGE = "vi";
const STORAGE_KEY = "listening-site:language";

const translations = {
  skipLink: { vi: "Bỏ qua tới nội dung chính", en: "Skip to main content", zh: "跳到主要内容",
    "zh-TW": "跳到主要內容" },
  brandSubtitle: { vi: "Luyện nghe tiếng Trung", en: "Chinese listening practice", zh: "中文听力练习",
    "zh-TW": "中文聽力練習" },

  "nav.features": { vi: "Tính năng", en: "Features", zh: "功能",
    "zh-TW": "功能" },
  "nav.preview": { vi: "Giao diện", en: "Interface", zh: "界面",
    "zh-TW": "界面" },
  "nav.download": { vi: "Tải xuống", en: "Download", zh: "下载",
    "zh-TW": "下載" },
  "nav.team": { vi: "Đội ngũ", en: "Team", zh: "团队",
    "zh-TW": "團隊" },
  navToggleLabel: { vi: "Mở menu", en: "Open menu", zh: "打开菜单",
    "zh-TW": "打開菜單" },

  "hero.eyebrow": {
    vi: "听力练习 · miễn phí & chạy offline",
    en: "听力练习 · free & runs offline",
    zh: "听力练习 · 免费且离线运行",
    "zh-TW": "聽力練習 · 免費且離線運行",
  },
  "hero.title": {
    vi: "Luyện nghe & phát âm tiếng Trung, theo đúng nhịp của bạn",
    en: "Practice Chinese listening & pronunciation, at your own pace",
    zh: "练习中文听力与发音，按照你自己的节奏",
    "zh-TW": "練習中文聽力與發音，按照你自己的節奏",
  },
  "hero.desc": {
    vi: "Ôn từ vựng HSK, luyện nghe hội thoại, gõ chính tả theo audio thật, hoặc dán thẳng một video YouTube để tự tách câu và luyện nghe. Tất cả chạy ngay trên máy tính của bạn, dữ liệu học tập lưu local, không cần tài khoản.",
    en: "Review HSK vocabulary, practice listening to dialogues, take dictation from real audio, or paste a YouTube video to split it into sentences automatically. Everything runs right on your computer, your learning data stays local, no account needed.",
    zh: "复习 HSK 词汇，练习对话听力，根据真实录音听写，或直接粘贴一个 YouTube 视频自动拆分成句子。一切都在你的电脑上运行，学习数据保存在本地，无需账户。",
    "zh-TW": "複習 HSK 詞彙，練習對話聽力，根據真實錄音聽寫，或直接粘貼一個 YouTube 視頻自動拆分成句子。一切都在你的電腦上運行，學習數據保存在本地，無需賬戶。",
  },
  "hero.ctaDownload": { vi: "Tải xuống miễn phí", en: "Download for free", zh: "免费下载",
    "zh-TW": "免費下載" },
  "hero.ctaFeatures": { vi: "Xem tính năng", en: "See features", zh: "查看功能",
    "zh-TW": "查看功能" },
  "hero.meta1": {
    vi: "✓ Linux (Fedora & AppImage) · Windows sắp ra mắt",
    en: "✓ Linux (Fedora & AppImage) · Windows coming soon",
    zh: "✓ Linux（Fedora 与 AppImage）· Windows 即将推出",
    "zh-TW": "✓ Linux（Fedora 與 AppImage）· Windows 即將推出",
  },
  "hero.meta2": {
    vi: "✓ Không quảng cáo, không tài khoản",
    en: "✓ No ads, no account required",
    zh: "✓ 无广告，无需账户",
    "zh-TW": "✓ 無廣告，無需賬戶",
  },

  "features.title": { vi: "Học theo cách phù hợp với bạn", en: "Learn your way", zh: "用适合你的方式学习",
    "zh-TW": "用適合你的方式學習" },
  "features.lead": {
    vi: "Một ứng dụng, nhiều hình thức luyện tập: từ ghi nhớ từ vựng tới phản xạ nghe câu dài.",
    en: "One app, many practice modes: from memorizing vocabulary to training your ear for long sentences.",
    zh: "一个应用，多种练习方式：从记忆词汇到训练长句的听力反应。",
    "zh-TW": "一個應用，多種練習方式：從記憶詞彙到訓練長句的聽力反應。",
  },

  "feature1.title": { vi: "Từ vựng HSK 1 → 7-9", en: "HSK 1 → 7-9 vocabulary", zh: "HSK 1 → 7-9 词汇",
    "zh-TW": "HSK 1 → 7-9 詞彙" },
  "feature1.desc": {
    vi: "Flashcard, nghe-gõ chính tả, trắc nghiệm, xếp chữ đúng thứ tự và cả đề thi thử, theo từng cấp độ.",
    en: "Flashcards, listen-and-type dictation, multiple choice, character ordering, and mock tests, all by level.",
    zh: "抽认卡、听写、选择题、汉字排序，还有各级别的模拟考试。",
    "zh-TW": "抽認卡、聽寫、選擇題、漢字排序，還有各級別的模擬考試。",
  },
  "feature2.title": { vi: "Luyện hội thoại", en: "Dialogue practice", zh: "对话练习",
    "zh-TW": "對話練習" },
  "feature2.desc": {
    vi: "Nghe đoạn hội thoại thật, trả lời trắc nghiệm, điền vào chỗ trống, hoặc gõ lại nguyên câu (Dictation).",
    en: "Listen to real dialogues, answer multiple-choice questions, fill in the blanks, or type back a full sentence (Dictation).",
    zh: "聆听真实对话，回答选择题、填空，或整句听写（Dictation）。",
    "zh-TW": "聆聽真實對話，回答選擇題、填空，或整句聽寫（Dictation）。",
  },
  "feature3.title": { vi: "Luyện nghe qua YouTube", en: "YouTube listening", zh: "YouTube 听力练习",
    "zh-TW": "YouTube 聽力練習" },
  "feature3.desc": {
    vi: "Dán một link video tiếng Trung, hệ thống tự tách câu, chuyển pinyin, cho bạn luyện nghe từng câu một.",
    en: "Paste a Chinese video link. The app splits it into sentences and converts to pinyin, so you can practice sentence by sentence.",
    zh: "粘贴一个中文视频链接，系统自动拆分句子并转换拼音，让你逐句练习听力。",
    "zh-TW": "粘貼一個中文視頻鏈接，系統自動拆分句子並轉換拼音，讓你逐句練習聽力。",
  },
  "feature4.title": { vi: "Theo dõi tiến trình", en: "Progress tracking", zh: "进度追踪",
    "zh-TW": "進度追蹤" },
  "feature4.desc": {
    vi: "Chuỗi ngày học liên tiếp, biểu đồ hoạt động, tiến độ theo từng cấp HSK, lưu hoàn toàn local.",
    en: "Daily streak, activity chart, and progress per HSK level, all stored locally.",
    zh: "连续学习天数、活动图表、各 HSK 等级进度，完全保存在本地。",
    "zh-TW": "連續學習天數、活動圖表、各 HSK 等級進度，完全保存在本地。",
  },
  "feature5.title": { vi: "Giản thể ⇄ Phồn thể", en: "Simplified ⇄ Traditional", zh: "简体 ⇄ 繁体",
    "zh-TW": "簡體 ⇄ 繁體" },
  "feature5.desc": {
    vi: "Chuyển đổi chữ Hán và cả Pinyin ⇄ Chú âm (Zhuyin) bất cứ lúc nào, không ảnh hưởng dữ liệu gốc.",
    en: "Switch Chinese characters and Pinyin ⇄ Zhuyin (Bopomofo) anytime, without touching the original data.",
    zh: "随时切换汉字和拼音 ⇄ 注音符号，不影响原始数据。",
    "zh-TW": "隨時切換漢字和拼音 ⇄ 注音符號，不影響原始數據。",
  },
  "feature6.title": { vi: "4 ngôn ngữ giao diện", en: "4 interface languages", zh: "4 种界面语言",
    "zh-TW": "4 種界面語言" },
  "feature6.desc": {
    vi: "Tiếng Việt, English, 简体中文, 繁體中文. Đổi ngay trong Cài đặt, áp dụng cho toàn bộ ứng dụng.",
    en: "Vietnamese, English, Simplified Chinese, Traditional Chinese. Switch anytime in Settings, applied across the whole app.",
    zh: "越南语、英语、简体中文、繁体中文。可在设置中随时切换，应用于整个应用程序。",
    "zh-TW": "越南語、英語、簡體中文、繁體中文。可在設置中隨時切換，應用於整個應用程序。",
  },

  "preview.title": { vi: "Gọn gàng, tập trung vào việc học", en: "Clean, focused on learning", zh: "简洁，专注于学习",
    "zh-TW": "簡潔，專注於學習" },
  "preview.desc": {
    vi: "Không quảng cáo, không thông báo làm phiền. Giao diện chỉ hiện những gì bạn cần cho phiên luyện tập hiện tại: pinyin, phiên âm, bản dịch đều có thể bật/tắt theo ý bạn.",
    en: "No ads, no distracting notifications. The interface only shows what you need for your current practice session: pinyin, phonetics, and translation can all be toggled on or off.",
    zh: "没有广告，没有干扰通知。界面只显示当前练习所需的内容：拼音、注音、翻译都可以随时开关。",
    "zh-TW": "沒有廣告，沒有干擾通知。界面只顯示當前練習所需的內容：拼音、注音、翻譯都可以隨時開關。",
  },
  "preview.check1": {
    vi: "Cập nhật từ vựng & hội thoại mới nhất chỉ với một cú nhấp",
    en: "Update the latest vocabulary & dialogues with a single click",
    zh: "只需一次点击即可更新最新的词汇和对话",
    "zh-TW": "只需一次點擊即可更新最新的詞彙和對話",
  },
  "preview.check2": {
    vi: "Phát âm chuẩn bằng giọng đọc tự nhiên (edge-tts)",
    en: "Accurate pronunciation with a natural voice (edge-tts)",
    zh: "使用自然语音（edge-tts）提供准确发音",
    "zh-TW": "使用自然語音（edge-tts）提供準確發音",
  },
  "preview.check3": {
    vi: "Toàn bộ tiến trình lưu trên máy. Xoá app không mất gì bạn không muốn mất",
    en: "All your progress stays on your device. Uninstalling won't lose anything you care about",
    zh: "所有学习进度都保存在本机。卸载应用不会丢失你在意的数据",
    "zh-TW": "所有學習進度都保存在本機。卸載應用不會丟失你在意的數據",
  },

  "download.title": { vi: "Tải xuống", en: "Download", zh: "下载",
    "zh-TW": "下載" },
  "download.lead": {
    vi: "Chọn hệ điều hành của bạn. Ứng dụng chạy offline, không cần tài khoản.",
    en: "Choose your operating system. The app runs offline, no account needed.",
    zh: "选择你的操作系统。应用离线运行，无需账户。",
    "zh-TW": "選擇你的操作系統。應用離線運行，無需賬戶。",
  },
  "download.cta": { vi: "Tải trên Google Drive", en: "Download on Google Drive", zh: "在 Google Drive 下载",
    "zh-TW": "在 Google Drive 下載" },
  "download.ctaNote": {
    vi: "File cài đặt cho Linux nằm trong thư mục này. Windows chưa có bản cài đặt.",
    en: "The Linux installer is in this folder. There is no Windows build yet.",
    zh: "此文件夹中提供 Linux 安装文件。Windows 版本尚未推出。",
    "zh-TW": "此文件夾中提供 Linux 安裝文件。Windows 版本尚未推出。",
  },
  "download.linux.desc": {
    vi: "Tải file <code>listening-electron-*.rpm</code> từ Google Drive, sau đó cài bằng dnf.",
    en: "Download the <code>listening-electron-*.rpm</code> file from Google Drive, then install it with dnf.",
    zh: "从 Google Drive 下载 <code>listening-electron-*.rpm</code> 文件，然后用 dnf 安装。",
    "zh-TW": "從 Google Drive 下載 <code>listening-electron-*.rpm</code> 文件，然後用 dnf 安裝。",
  },
  "download.linux.note": {
    vi: "Không dùng Fedora? File <code>.AppImage</code> trong cùng thư mục chạy được trên mọi distro Linux, chỉ cần <code>chmod +x</code> rồi mở.",
    en: "Not on Fedora? The <code>.AppImage</code> file in the same folder runs on any Linux distro, just <code>chmod +x</code> it and open.",
    zh: "不用 Fedora？同一文件夹里的 <code>.AppImage</code> 文件可以在任何 Linux 发行版上运行，只需 <code>chmod +x</code> 后打开即可。",
    "zh-TW": "不用 Fedora？同一文件夾裡的 <code>.AppImage</code> 文件可以在任何 Linux 發行版上運行，只需 <code>chmod +x</code> 後打開即可。",
  },
  "download.win.badge": { vi: "Chưa công bố", en: "Not released yet", zh: "尚未发布",
    "zh-TW": "尚未發布" },
  "download.win.desc": {
    vi: "Bản Windows hiện chưa được phát hành. Dự án đang tập trung hoàn thiện trên Linux trước; Windows có thể ra mắt trong một bản cập nhật sau này.",
    en: "There is no Windows release yet. The project is currently focused on finishing the Linux version first — Windows may follow in a later update.",
    zh: "目前尚未发布 Windows 版本。项目目前专注于先完善 Linux 版本，Windows 版本可能会在之后的更新中推出。",
    "zh-TW": "目前尚未發布 Windows 版本。項目目前專注於先完善 Linux 版本，Windows 版本可能會在之後的更新中推出。",
  },
  "download.win.note": {
    vi: 'Theo dõi tiến độ tại <a href="https://github.com/nguyenlog205/self-chinese-listening-practice" target="_blank" rel="noopener noreferrer">kho GitHub của dự án</a>.',
    en: 'Follow progress on the <a href="https://github.com/nguyenlog205/self-chinese-listening-practice" target="_blank" rel="noopener noreferrer">project\'s GitHub repo</a>.',
    zh: '在<a href="https://github.com/nguyenlog205/self-chinese-listening-practice" target="_blank" rel="noopener noreferrer">项目的 GitHub 仓库</a>关注进展。',
    "zh-TW": '在<a href="https://github.com/nguyenlog205/self-chinese-listening-practice" target="_blank" rel="noopener noreferrer">項目的 GitHub 倉庫</a>關注進展。',
  },
  "download.sourceLabel": { vi: "Mã nguồn:", en: "Source code:", zh: "源代码：",
    "zh-TW": "源代碼：" },

  "team.title": { vi: "Đội ngũ phát triển", en: "Development team", zh: "开发团队",
    "zh-TW": "開發團隊" },
  "team.lead": {
    vi: "Được xây dựng bởi một nhóm sinh viên tại thành phố mang tên Bác.",
    en: "Built by a team of students in Ho Chi Minh City.",
    zh: "由一群来自胡志明市的学生团队打造。",
    "zh-TW": "由一群來自胡志明市的學生團隊打造。",
  },

  "footer.copyright": {
    vi: "Dự án phi lợi nhuận cho mục đích học tập.",
    en: "A non-profit project for educational purposes.",
    zh: "非营利性教育项目。",
    "zh-TW": "非營利性教育項目。",
  },
};

function readStoredLanguage() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANGUAGE;
}

function translate(key, lang) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANGUAGE] ?? key;
}

function applyLanguage(lang) {
  document.documentElement.lang = lang === "zh-TW" ? "zh-Hant" : lang === "zh" ? "zh-Hans" : lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = translate(el.getAttribute("data-i18n"), lang);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = translate(el.getAttribute("data-i18n-html"), lang);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", translate(el.getAttribute("data-i18n-aria"), lang));
  });

  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === lang);
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  window.localStorage.setItem(STORAGE_KEY, lang);
}

function setLanguage(lang) {
  if (!LANGUAGES.some((l) => l.code === lang)) return;
  applyLanguage(lang);
}

function initLanguageSwitcher() {
  document.querySelectorAll(".lang-switch").forEach((group) => {
    group.innerHTML = LANGUAGES.map(
      (l) => `<button type="button" data-lang="${l.code}" title="${l.label}">${l.flag}</button>`
    ).join("");
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (btn) setLanguage(btn.dataset.lang);
    });
  });
}

initLanguageSwitcher();
applyLanguage(readStoredLanguage());
