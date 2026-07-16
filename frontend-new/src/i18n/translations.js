export const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export const DEFAULT_LANGUAGE = "vi";

// Flat key -> { vi, en, zh } dictionary. Add new keys here as new UI text is
// introduced; every key must have all three languages filled in.
export const translations = {
  "brand.title": { vi: "听力练习", en: "听力练习", zh: "听力练习" },
  "brand.subtitle": {
    vi: "Luyện nghe tiếng Trung",
    en: "Chinese listening practice",
    zh: "中文听力练习",
  },

  "nav.home": { vi: "Trang chủ", en: "Home", zh: "首页" },
  "nav.listening": { vi: "Luyện nghe", en: "Listening", zh: "听力练习" },
  "nav.settings": { vi: "Cài đặt", en: "Settings", zh: "设置" },

  "home.eyebrow": { vi: "听力练习", en: "Listening practice", zh: "听力练习" },
  "home.title": {
    vi: "Chào mừng quay lại",
    en: "Welcome back",
    zh: "欢迎回来",
  },
  "home.description": {
    vi: "Dán một video YouTube tiếng Trung, để hệ thống tự nhận diện giọng nói và chuyển pinyin, rồi luyện nghe từng câu một.",
    en: "Paste a Chinese YouTube video, let the system transcribe it and convert to pinyin, then practice sentence by sentence.",
    zh: "粘贴一个中文 YouTube 视频，系统会自动识别语音并转换拼音，然后逐句练习听力。",
  },
  "home.addTitle": {
    vi: "Thêm bài học mới",
    en: "Add a new lesson",
    zh: "添加新课程",
  },
  "home.addPlaceholder": {
    vi: "Dán link YouTube vào đây...",
    en: "Paste a YouTube link here...",
    zh: "在此粘贴 YouTube 链接...",
  },
  "home.addButton": { vi: "+ Thêm bài", en: "+ Add lesson", zh: "+ 添加课程" },
  "home.libraryTitle": {
    vi: "Thư viện bài học",
    en: "Lesson library",
    zh: "课程库",
  },
  "home.emptyText": {
    vi: "Chưa có bài học nào. Thêm một link ở trên để bắt đầu luyện nghe.",
    en: "No lessons yet. Add a link above to start practicing.",
    zh: "还没有课程。请在上方添加链接以开始练习。",
  },

  "settings.title": { vi: "Cài đặt", en: "Settings", zh: "设置" },
  "settings.description": {
    vi: "Tùy chỉnh trải nghiệm sử dụng ứng dụng.",
    en: "Customize your app experience.",
    zh: "自定义您的应用体验。",
  },
  "settings.languageLabel": {
    vi: "Ngôn ngữ hiển thị",
    en: "Display language",
    zh: "显示语言",
  },
  "settings.languageDescription": {
    vi: "Chọn ngôn ngữ hiển thị cho toàn bộ ứng dụng.",
    en: "Choose the display language for the whole app.",
    zh: "选择整个应用程序的显示语言。",
  },
};

export function translate(key, lang) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANGUAGE] ?? key;
}
