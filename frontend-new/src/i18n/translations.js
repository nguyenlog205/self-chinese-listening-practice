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
  "nav.hsk": { vi: "Tài liệu HSK", en: "HSK Materials", zh: "HSK 材料" },
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

  "hsk.title": { vi: "Tài liệu HSK", en: "HSK Materials", zh: "HSK 材料" },
  "hsk.description": {
    vi: "Ôn luyện từ vựng, nghe, đọc và làm đề thi thử theo từng cấp độ HSK.",
    en: "Practice vocabulary, listening, reading and mock tests by HSK level.",
    zh: "按 HSK 级别练习词汇、听力、阅读和模拟考试。",
  },
  "hsk.tab.vocabulary": { vi: "Từ vựng", en: "Vocabulary", zh: "词汇" },
  "hsk.tab.listening": { vi: "Luyện nghe", en: "Listening", zh: "听力" },
  "hsk.tab.reading": { vi: "Luyện đọc", en: "Reading", zh: "阅读" },
  "hsk.tab.mocktest": { vi: "Đề thi thử", en: "Mock Test", zh: "模拟考试" },

  "hsk.menu.vocabulary": {
    vi: "Học và ôn từ vựng theo từng cấp độ HSK.",
    en: "Learn and review vocabulary by HSK level.",
    zh: "按 HSK 级别学习和复习词汇。",
  },
  "hsk.menu.listening": {
    vi: "Nghe và gõ lại chữ Hán để luyện phản xạ nghe.",
    en: "Listen and type back the characters to train your ear.",
    zh: "听录音并输入汉字以练习听力。",
  },
  "hsk.menu.reading": {
    vi: "Đọc đoạn văn mẫu kèm pinyin và bản dịch.",
    en: "Read sample passages with pinyin and translation.",
    zh: "阅读带拼音和翻译的示例文章。",
  },
  "hsk.menu.mocktest": {
    vi: "Làm bài trắc nghiệm nhanh để tự kiểm tra.",
    en: "Take a quick quiz to test yourself.",
    zh: "做一个小测验来检验自己。",
  },

  "hsk.common.back": { vi: "Quay lại", en: "Back", zh: "返回" },
  "hsk.common.play": { vi: "Phát âm", en: "Play", zh: "播放" },
  "hsk.common.check": { vi: "Kiểm tra", en: "Check", zh: "检查" },
  "hsk.common.next": { vi: "Tiếp theo", en: "Next", zh: "下一个" },
  "hsk.common.prev": { vi: "Trước", en: "Prev", zh: "上一个" },
  "hsk.common.correct": { vi: "Chính xác!", en: "Correct!", zh: "正确！" },
  "hsk.common.incorrect": { vi: "Chưa đúng", en: "Not quite", zh: "不正确" },

  "hsk.vocab.searchPlaceholder": {
    vi: "Tìm từ vựng...",
    en: "Search vocabulary...",
    zh: "搜索词汇...",
  },
  "hsk.vocab.progress": { vi: "Đã học", en: "Learned", zh: "已学" },
  "hsk.vocab.page": { vi: "Trang", en: "Page", zh: "页" },
  "hsk.vocab.learned": { vi: "✓ Đã thuộc", en: "✓ Learned", zh: "✓ 已掌握" },
  "hsk.vocab.markLearned": { vi: "Đánh dấu đã thuộc", en: "Mark learned", zh: "标记已掌握" },
  "hsk.vocab.noResults": {
    vi: "Không tìm thấy từ nào.",
    en: "No words found.",
    zh: "未找到相关词汇。",
  },

  "hsk.listening.hint": {
    vi: "Nghe và gõ lại chữ Hán bạn nghe được.",
    en: "Listen and type the Chinese characters you hear.",
    zh: "听录音并输入你听到的汉字。",
  },
  "hsk.listening.inputPlaceholder": {
    vi: "Gõ chữ Hán vào đây...",
    en: "Type the characters here...",
    zh: "在此输入汉字...",
  },
  "hsk.listening.showHint": { vi: "Hiện gợi ý", en: "Show hint", zh: "显示提示" },
  "hsk.listening.hideHint": { vi: "Ẩn gợi ý", en: "Hide hint", zh: "隐藏提示" },
  "hsk.listening.score": { vi: "Điểm", en: "Score", zh: "得分" },

  "hsk.reading.showPinyin": { vi: "Hiện pinyin", en: "Show pinyin", zh: "显示拼音" },
  "hsk.reading.hidePinyin": { vi: "Ẩn pinyin", en: "Hide pinyin", zh: "隐藏拼音" },
  "hsk.reading.showTranslation": {
    vi: "Hiện bản dịch",
    en: "Show translation",
    zh: "显示翻译",
  },
  "hsk.reading.hideTranslation": {
    vi: "Ẩn bản dịch",
    en: "Hide translation",
    zh: "隐藏翻译",
  },

  "hsk.mocktest.question": { vi: "Câu hỏi", en: "Question", zh: "题目" },
  "hsk.mocktest.prompt": {
    vi: "Từ này có nghĩa là gì?",
    en: "What does this word mean?",
    zh: "这个词是什么意思？",
  },
  "hsk.mocktest.done": { vi: "Hoàn thành!", en: "Done!", zh: "完成！" },
  "hsk.mocktest.restart": { vi: "Làm lại", en: "Restart", zh: "重新开始" },
  "hsk.mocktest.finish": { vi: "Xem kết quả", en: "See results", zh: "查看结果" },

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





  'nav.about': {
    vi: 'Về chúng tôi',
    en: 'About us',
    zh: '关于我们'
  },
  'about.title': {
    vi: 'Về chúng tôi',
    en: 'About us',
    zh: '关于我们'
  },
  'about.description': {
    vi: 'Ứng dụng luyện nghe tiếng Trung thông minh.',
    en: 'Smart Chinese listening practice app.',
    zh: '智能中文听力练习应用'
  },
  'about.team': {
    vi: 'Được phát triển bởi nhóm sinh viên ĐH Bách Khoa.',
    en: 'Developed by a team of university students.',
    zh: '由大学生团队开发'
  }
};

export function translate(key, lang) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANGUAGE] ?? key;
}
