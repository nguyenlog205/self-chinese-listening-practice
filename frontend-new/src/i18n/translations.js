export const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

export const DEFAULT_LANGUAGE = "vi";

// Flat key -> { vi, en, zh } dictionary. Add new keys here as new UI text is
// introduced; every key must have all three languages filled in.
export const translations = {
  "common.loading": { vi: "Đang tải...", en: "Loading...", zh: "加载中..." },

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
  "home.titleWithName": {
    vi: "Chào mừng {{name}} quay lại!",
    en: "Welcome back, {{name}}!",
    zh: "欢迎回来，{{name}}!",
  },
  "home.streak.days": { vi: "ngày", en: "days", zh: "天" },
  "home.streak.subtitle": {
    vi: "Chuỗi ngày học liên tiếp",
    en: "Your learning streak",
    zh: "连续学习天数",
  },
  "home.streak.longest": { vi: "Kỷ lục", en: "Longest streak", zh: "最长记录" },

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

  "listening.title": { vi: "Luyện nghe", en: "Listening", zh: "听力练习" },
  "listening.description": {
    vi: "Chọn một hình thức luyện nghe bên dưới để bắt đầu.",
    en: "Pick a listening practice mode below to get started.",
    zh: "选择下方的一种听力练习方式开始。",
  },

  "listening.group.word.title": { vi: "Luyện nghe theo từ", en: "Word-level listening", zh: "词汇听力" },
  "listening.group.word.desc": {
    vi: "Luyện phản xạ nghe với từng từ vựng riêng lẻ.",
    en: "Train your ear with individual vocabulary words.",
    zh: "通过单个词汇练习听力反应。",
  },
  "listening.group.sentence.title": {
    vi: "Luyện nghe câu & hội thoại",
    en: "Sentence & dialogue listening",
    zh: "句子与对话听力",
  },
  "listening.group.sentence.desc": {
    vi: "Luyện nghe hiểu với câu, đoạn hội thoại và video thật.",
    en: "Practice listening comprehension with sentences, dialogues and real video.",
    zh: "通过句子、对话和真实视频练习听力理解。",
  },

  "listening.tab.youtube": { vi: "Luyện nghe YouTube", en: "YouTube listening", zh: "YouTube 听力" },
  "listening.tab.dictation": { vi: "Chính tả (nghe - gõ)", en: "Dictation", zh: "听写" },
  "listening.tab.choice": { vi: "Nghe chọn đáp án", en: "Listen & choose", zh: "听力选择" },
  "listening.tab.order": { vi: "Nghe sắp xếp", en: "Listen & order", zh: "听力排序" },
  "listening.tab.dialogueChoice": {
    vi: "Hội thoại - chọn đáp án",
    en: "Dialogue - multiple choice",
    zh: "对话 - 选择题",
  },
  "listening.tab.dialogueCloze": {
    vi: "Hội thoại - điền vào chỗ trống",
    en: "Dialogue - fill in the blank",
    zh: "对话 - 填空",
  },

  "listening.menu.youtube": {
    vi: "Dán link YouTube, hệ thống tự tách câu để bạn luyện nghe từng câu.",
    en: "Paste a YouTube link and practice sentence by sentence.",
    zh: "粘贴 YouTube 链接，逐句练习听力。",
  },
  "listening.menu.dictation": {
    vi: "Nghe phát âm và gõ lại chữ Hán chính xác.",
    en: "Listen to the pronunciation and type the exact characters.",
    zh: "听发音并输入正确的汉字。",
  },
  "listening.menu.choice": {
    vi: "Nghe phát âm rồi chọn đúng nghĩa trong 4 đáp án.",
    en: "Listen to a word, then pick its correct meaning from 4 options.",
    zh: "听发音后从 4 个选项中选择正确的意思。",
  },
  "listening.menu.order": {
    vi: "Nghe phát âm rồi sắp xếp các chữ theo đúng thứ tự.",
    en: "Listen to a word, then arrange its characters in the right order.",
    zh: "听发音后将汉字按正确顺序排列。",
  },
  "listening.menu.dialogueChoice": {
    vi: "Nghe một đoạn hội thoại ngắn rồi chọn đáp án đúng cho câu hỏi.",
    en: "Listen to a short dialogue, then pick the correct answer to the question.",
    zh: "听一段简短对话，然后为问题选择正确答案。",
  },
  "listening.menu.dialogueCloze": {
    vi: "Nghe một đoạn hội thoại ngắn rồi gõ từ còn thiếu vào chỗ trống.",
    en: "Listen to a short dialogue, then type the missing word into the blank.",
    zh: "听一段简短对话，然后在空白处输入缺失的词。",
  },

  "listening.common.back": { vi: "Quay lại", en: "Back", zh: "返回" },

  "listening.youtube.backToLibrary": { vi: "Quay lại thư viện", en: "Back to library", zh: "返回课程库" },
  "listening.youtube.playSegment": { vi: "Phát câu này", en: "Play this sentence", zh: "播放这句" },
  "listening.youtube.showText": { vi: "Hiện chữ Hán", en: "Show text", zh: "显示汉字" },
  "listening.youtube.showPinyin": { vi: "Hiện pinyin", en: "Show pinyin", zh: "显示拼音" },
  "listening.youtube.dictationMode": { vi: "Chế độ chính tả", en: "Dictation mode", zh: "听写模式" },
  "listening.youtube.segments": { vi: "câu", en: "sentences", zh: "句" },
  "listening.youtube.delete": { vi: "Xóa bài học", en: "Delete lesson", zh: "删除课程" },

  "listening.dictation.hint": {
    vi: "Nghe và gõ lại chữ Hán bạn nghe được.",
    en: "Listen and type the Chinese characters you hear.",
    zh: "听录音并输入你听到的汉字。",
  },

  "listening.choice.hint": {
    vi: "Nghe phát âm rồi chọn đúng nghĩa của từ.",
    en: "Listen to the word, then pick its correct meaning.",
    zh: "听发音后选择该词的正确意思。",
  },

  "listening.order.hint": {
    vi: "Nghe phát âm rồi bấm các chữ theo đúng thứ tự để ghép thành từ.",
    en: "Listen to the word, then tap the characters in the right order.",
    zh: "听发音后按正确顺序点击汉字。",
  },
  "listening.order.reset": { vi: "Làm lại", en: "Reset", zh: "重置" },

  "listening.dialogue.playAll": { vi: "Phát cả đoạn hội thoại", en: "Play whole dialogue", zh: "播放整段对话" },
  "listening.dialogue.showScript": { vi: "Hiện lời hội thoại", en: "Show script", zh: "显示对话原文" },
  "listening.dialogueChoice.hint": {
    vi: "Nghe đoạn hội thoại rồi chọn đáp án đúng cho câu hỏi bên dưới.",
    en: "Listen to the dialogue, then answer the question below.",
    zh: "听对话，然后回答下面的问题。",
  },
  "listening.dialogueCloze.hint": {
    vi: "Nghe đoạn hội thoại rồi gõ từ còn thiếu vào ô trống.",
    en: "Listen to the dialogue, then type the missing word into the blank.",
    zh: "听对话，然后在空白处输入缺失的词。",
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
    vi: 'Được phát triển bởi nhóm sinh viên tại thành phố mang tên Bác!',
    en: 'Developed by a team of university students from Ho Chi Minh City!',
    zh: '由大学生在胡志明市团队开发!'
  }
};

export function translate(key, lang, params) {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[lang] ?? entry[DEFAULT_LANGUAGE] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{{${name}}}`, value);
    }
  }
  return text;
}
