export { HSK_LEVELS } from "../../../shared/contentApi";

export const GRAMMAR_POINTS = {
  1: [
    {
      id: "shi",
      title: { vi: "Câu với 是 (là)", en: "Sentences with 是 (to be)", zh: "是字句" },
      structure: "A + 是 + B",
      explanation: {
        vi: "Dùng 是 để nối chủ ngữ với danh từ vị ngữ, tương đương động từ \"là\". Phủ định thêm 不 trước 是.",
        en: "Use 是 to link a subject to a noun predicate, like \"to be\". Negate with 不 before 是.",
        zh: "用「是」连接主语和名词谓语，相当于英语的 to be。否定时在「是」前加「不」。",
      },
      examples: [
        { hanzi: "我是学生。", pinyin: "Wǒ shì xuésheng.", translation: { vi: "Tôi là học sinh.", en: "I am a student." } },
        { hanzi: "他不是老师。", pinyin: "Tā bú shì lǎoshī.", translation: { vi: "Anh ấy không phải là giáo viên.", en: "He is not a teacher." } },
      ],
    },
    {
      id: "you",
      title: { vi: "Câu với 有 (có)", en: "Sentences with 有 (to have)", zh: "有字句" },
      structure: "A + 有 + B",
      explanation: {
        vi: "有 diễn tả sự sở hữu hoặc tồn tại. Phủ định dùng 没有, không dùng 不有.",
        en: "有 expresses possession or existence. Negate with 没有, never 不有.",
        zh: "「有」表示领有或存在。否定形式是「没有」，不能说「不有」。",
      },
      examples: [
        { hanzi: "我有一本书。", pinyin: "Wǒ yǒu yì běn shū.", translation: { vi: "Tôi có một quyển sách.", en: "I have a book." } },
        { hanzi: "他没有钱。", pinyin: "Tā méiyǒu qián.", translation: { vi: "Anh ấy không có tiền.", en: "He doesn't have money." } },
      ],
    },
    {
      id: "adj-pred",
      title: { vi: "Câu vị ngữ tính từ", en: "Adjectival predicate sentences", zh: "形容词谓语句" },
      structure: "A + (很) + Adj",
      explanation: {
        vi: "Tính từ có thể làm vị ngữ trực tiếp mà không cần 是. Thường thêm 很 phía trước dù không mang nghĩa \"rất\".",
        en: "Adjectives can act as the predicate directly without 是. 很 is often added before it even without meaning \"very\".",
        zh: "形容词可以直接做谓语，不需要「是」。前面常加「很」，此时不一定表示程度。",
      },
      examples: [
        { hanzi: "今天天气很好。", pinyin: "Jīntiān tiānqì hěn hǎo.", translation: { vi: "Hôm nay thời tiết đẹp.", en: "The weather is nice today." } },
        { hanzi: "这个苹果很甜。", pinyin: "Zhège píngguǒ hěn tián.", translation: { vi: "Quả táo này ngọt.", en: "This apple is sweet." } },
      ],
    },
  ],
  2: [
    {
      id: "le",
      title: { vi: "Trợ từ 了 (hoàn thành)", en: "Aspect particle 了 (completion)", zh: "动态助词「了」" },
      structure: "V + 了 + O",
      explanation: {
        vi: "了 đặt sau động từ để chỉ hành động đã hoàn thành hoặc đã xảy ra.",
        en: "了 after a verb marks that the action has been completed or has occurred.",
        zh: "「了」放在动词后，表示动作已经完成或发生。",
      },
      examples: [
        { hanzi: "我吃了早饭。", pinyin: "Wǒ chīle zǎofàn.", translation: { vi: "Tôi đã ăn sáng.", en: "I have eaten breakfast." } },
        { hanzi: "他买了一件衣服。", pinyin: "Tā mǎile yí jiàn yīfu.", translation: { vi: "Anh ấy đã mua một chiếc áo.", en: "He bought a piece of clothing." } },
      ],
    },
    {
      id: "zai-progressive",
      title: { vi: "在 / 正在 (đang)", en: "在 / 正在 (progressive)", zh: "在／正在表示进行" },
      structure: "(正)在 + V",
      explanation: {
        vi: "在 hoặc 正在 trước động từ diễn tả hành động đang diễn ra, thường đi kèm 呢 cuối câu.",
        en: "在 or 正在 before the verb shows an ongoing action, often paired with 呢 at the end.",
        zh: "「在」或「正在」放在动词前，表示动作正在进行，句末常加「呢」。",
      },
      examples: [
        { hanzi: "我在看电视呢。", pinyin: "Wǒ zài kàn diànshì ne.", translation: { vi: "Tôi đang xem TV.", en: "I am watching TV." } },
        { hanzi: "她正在做饭。", pinyin: "Tā zhèngzài zuò fàn.", translation: { vi: "Cô ấy đang nấu ăn.", en: "She is cooking." } },
      ],
    },
  ],
  3: [
    {
      id: "guo",
      title: { vi: "Trợ từ 过 (kinh nghiệm)", en: "Aspect particle 过 (experience)", zh: "经历助词「过」" },
      structure: "V + 过",
      explanation: {
        vi: "过 sau động từ diễn tả kinh nghiệm đã từng làm trong quá khứ, không nhấn mạnh thời điểm cụ thể.",
        en: "过 after a verb expresses a past experience, without emphasizing a specific time.",
        zh: "「过」放在动词后，表示曾经有过某种经历，不强调具体时间。",
      },
      examples: [
        { hanzi: "我去过北京。", pinyin: "Wǒ qùguo Běijīng.", translation: { vi: "Tôi đã từng đến Bắc Kinh.", en: "I have been to Beijing before." } },
        { hanzi: "他没吃过中国菜。", pinyin: "Tā méi chīguo Zhōngguó cài.", translation: { vi: "Anh ấy chưa từng ăn món Trung Quốc.", en: "He has never eaten Chinese food." } },
      ],
    },
    {
      id: "bijiao",
      title: { vi: "Câu so sánh với 比", en: "Comparisons with 比", zh: "比字句" },
      structure: "A + 比 + B + Adj",
      explanation: {
        vi: "比 dùng để so sánh hai đối tượng, tính từ đặt sau B, không thêm 很 trước tính từ.",
        en: "比 compares two things; the adjective follows B, and 很 is not added before it.",
        zh: "「比」用于比较两者，形容词放在 B 之后，前面不加「很」。",
      },
      examples: [
        { hanzi: "他比我高。", pinyin: "Tā bǐ wǒ gāo.", translation: { vi: "Anh ấy cao hơn tôi.", en: "He is taller than me." } },
        { hanzi: "今天比昨天冷。", pinyin: "Jīntiān bǐ zuótiān lěng.", translation: { vi: "Hôm nay lạnh hơn hôm qua.", en: "Today is colder than yesterday." } },
      ],
    },
  ],
  4: [
    {
      id: "bei",
      title: { vi: "Câu bị động với 被", en: "Passive sentences with 被", zh: "被字句" },
      structure: "A + 被 + B + V",
      explanation: {
        vi: "被 đưa tân ngữ chịu tác động lên đầu câu, B là chủ thể gây ra hành động, có thể lược bỏ.",
        en: "被 fronts the affected object; B is the agent performing the action and can be omitted.",
        zh: "「被」把受动作影响的对象提到句首，B 是施动者，可以省略。",
      },
      examples: [
        { hanzi: "我的钱包被偷了。", pinyin: "Wǒ de qiánbāo bèi tōu le.", translation: { vi: "Ví của tôi bị mất trộm.", en: "My wallet was stolen." } },
        { hanzi: "杯子被他打破了。", pinyin: "Bēizi bèi tā dǎpò le.", translation: { vi: "Cái cốc bị anh ấy làm vỡ.", en: "The cup was broken by him." } },
      ],
    },
    {
      id: "ba",
      title: { vi: "Câu chữ 把", en: "把 sentences", zh: "把字句" },
      structure: "A + 把 + B + V + 结果",
      explanation: {
        vi: "把 đưa tân ngữ lên trước động từ để nhấn mạnh kết quả xử lý tân ngữ đó.",
        en: "把 moves the object before the verb to emphasize the result of handling that object.",
        zh: "「把」把宾语提到动词前，强调对该宾语的处置结果。",
      },
      examples: [
        { hanzi: "请把门关上。", pinyin: "Qǐng bǎ mén guānshàng.", translation: { vi: "Hãy đóng cửa lại.", en: "Please close the door." } },
        { hanzi: "我把作业写完了。", pinyin: "Wǒ bǎ zuòyè xiěwán le.", translation: { vi: "Tôi đã viết xong bài tập.", en: "I finished writing my homework." } },
      ],
    },
  ],
  5: [
    {
      id: "jinguan",
      title: { vi: "尽管...但是... (mặc dù...nhưng...)", en: "尽管...但是... (although...but...)", zh: "尽管…但是…" },
      structure: "尽管 + A，但是 + B",
      explanation: {
        vi: "Cấu trúc nhượng bộ, thừa nhận sự thật A nhưng kết luận B vẫn xảy ra trái ngược.",
        en: "A concessive structure: acknowledges fact A, but concludes with contrasting result B.",
        zh: "表示让步关系，承认事实 A，但结果 B 与预期相反。",
      },
      examples: [
        { hanzi: "尽管很累，但是他还在工作。", pinyin: "Jǐnguǎn hěn lèi, dànshì tā hái zài gōngzuò.", translation: { vi: "Mặc dù rất mệt, nhưng anh ấy vẫn đang làm việc.", en: "Although very tired, he is still working." } },
      ],
    },
    {
      id: "yuelaiyueduo",
      title: { vi: "越来越 (ngày càng)", en: "越来越 (more and more)", zh: "越来越" },
      structure: "越来越 + Adj/V",
      explanation: {
        vi: "Diễn tả mức độ tăng dần theo thời gian.",
        en: "Expresses a degree that increases progressively over time.",
        zh: "表示程度随时间不断增加。",
      },
      examples: [
        { hanzi: "天气越来越冷了。", pinyin: "Tiānqì yuè lái yuè lěng le.", translation: { vi: "Thời tiết ngày càng lạnh.", en: "The weather is getting colder and colder." } },
      ],
    },
  ],
  6: [
    {
      id: "wulun",
      title: { vi: "无论...都... (bất kể...đều...)", en: "无论...都... (regardless...all...)", zh: "无论…都…" },
      structure: "无论 + A，都 + B",
      explanation: {
        vi: "Nhấn mạnh kết quả B không đổi bất kể điều kiện A là gì, A thường chứa từ nghi vấn hoặc lựa chọn.",
        en: "Emphasizes that B holds true regardless of condition A, which usually contains a question word or a choice.",
        zh: "强调无论条件 A 如何，结果 B 都不变，A 中常有疑问词或选择项。",
      },
      examples: [
        { hanzi: "无论多忙，他都会锻炼身体。", pinyin: "Wúlùn duō máng, tā dōu huì duànliàn shēntǐ.", translation: { vi: "Dù bận đến đâu, anh ấy vẫn tập thể dục.", en: "No matter how busy he is, he always exercises." } },
      ],
    },
  ],
  "7-9": [
    {
      id: "yizhi",
      title: { vi: "以至于 (đến nỗi)", en: "以至于 (to such an extent that)", zh: "以至于" },
      structure: "A，以至于 + B",
      explanation: {
        vi: "Diễn tả kết quả B là hệ quả tự nhiên hoặc cực đoan của mức độ A, thường mang sắc thái tiêu cực.",
        en: "Expresses that B is a natural or extreme consequence of the degree of A, often with a negative nuance.",
        zh: "表示 B 是 A 达到的程度所自然导致的结果，常带负面语气。",
      },
      examples: [
        { hanzi: "他工作太投入，以至于忘记了吃饭。", pinyin: "Tā gōngzuò tài tóurù, yǐzhìyú wàngjìle chīfàn.", translation: { vi: "Anh ấy làm việc quá say mê, đến nỗi quên cả ăn cơm.", en: "He was so absorbed in work that he forgot to eat." } },
      ],
    },
  ],
};

export const READING_PASSAGES = {
  1: {
    title: { vi: "Gia đình tôi", en: "My family", zh: "我的家" },
    hanzi:
      "我叫马丁。这是我的爸爸，那是我的妈妈。我喜欢我的家。今天天气很好，我们一起吃饭。",
    pinyin:
      "Wǒ jiào Mǎdīng. Zhè shì wǒ de bàba, nà shì wǒ de māma. Wǒ xǐhuan wǒ de jiā. Jīntiān tiānqì hěn hǎo, wǒmen yìqǐ chīfàn.",
    translation: {
      vi: "Tôi tên là Martin. Đây là bố tôi, kia là mẹ tôi. Tôi yêu gia đình mình. Hôm nay thời tiết đẹp, chúng tôi cùng nhau ăn cơm.",
      en: "My name is Martin. This is my father, that is my mother. I love my family. The weather is nice today, we're eating together.",
    },
  },
  2: {
    title: { vi: "Một chuyến du lịch", en: "A trip", zh: "一次旅游" },
    hanzi:
      "上个星期，我和朋友去了北京旅游。我们坐飞机到机场，然后住在一个宾馆里。北京的天气很冷，但是我们玩得很开心。",
    pinyin:
      "Shàng ge xīngqī, wǒ hé péngyou qùle Běijīng lǚyóu. Wǒmen zuò fēijī dào jīchǎng, ránhòu zhù zài yí ge bīnguǎn lǐ. Běijīng de tiānqì hěn lěng, dànshì wǒmen wán de hěn kāixīn.",
    translation: {
      vi: "Tuần trước, tôi và bạn đã đi du lịch Bắc Kinh. Chúng tôi đi máy bay tới sân bay, sau đó ở tại một khách sạn. Thời tiết Bắc Kinh rất lạnh, nhưng chúng tôi chơi rất vui.",
      en: "Last week, my friend and I traveled to Beijing. We took a flight to the airport, then stayed at a hotel. Beijing's weather was cold, but we had a great time.",
    },
  },
  3: {
    title: { vi: "Thói quen sống xanh", en: "Green habits", zh: "环保的习惯" },
    hanzi:
      "为了保护环境，越来越多的人开始改变自己的生活习惯。他们决定少用塑料袋，多参加环保活动，这也是一种解决问题的好办法。",
    pinyin:
      "Wèile bǎohù huánjìng, yuè lái yuè duō de rén kāishǐ gǎibiàn zìjǐ de shēnghuó xíguàn. Tāmen juédìng shǎo yòng sùliàodài, duō cānjiā huánbǎo huódòng, zhè yě shì yì zhǒng jiějué wèntí de hǎo bànfǎ.",
    translation: {
      vi: "Để bảo vệ môi trường, ngày càng nhiều người bắt đầu thay đổi thói quen sinh hoạt của mình. Họ quyết định dùng ít túi nhựa hơn, tham gia nhiều hoạt động bảo vệ môi trường hơn, đây cũng là một cách hay để giải quyết vấn đề.",
      en: "To protect the environment, more and more people are starting to change their living habits. They've decided to use fewer plastic bags and take part in more environmental activities, which is also a good way to solve the problem.",
    },
  },
  4: {
    title: { vi: "Con đường thành công", en: "The road to success", zh: "成功之路" },
    hanzi:
      "每个人对成功的理解都不一样。有的人认为成功是找到一份好工作，有的人认为是实现自己的梦想。不管怎么样，只要我们按照计划努力去做，就一定能超过自己的期待。",
    pinyin:
      "Měi ge rén duì chénggōng de lǐjiě dōu bù yíyàng. Yǒu de rén rènwéi chénggōng shì zhǎodào yí fèn hǎo gōngzuò, yǒu de rén rènwéi shì shíxiàn zìjǐ de mèngxiǎng. Bùguǎn zěnmeyàng, zhǐyào wǒmen ànzhào jìhuà nǔlì qù zuò, jiù yídìng néng chāoguò zìjǐ de qídài.",
    translation: {
      vi: "Mỗi người hiểu về thành công theo cách khác nhau. Có người cho rằng thành công là tìm được một công việc tốt, có người lại cho rằng đó là thực hiện được ước mơ của mình. Dù thế nào đi nữa, chỉ cần chúng ta theo kế hoạch mà nỗ lực, chắc chắn sẽ vượt qua kỳ vọng của chính mình.",
      en: "Everyone understands success differently. Some think it means finding a good job, others think it means realizing their dreams. Either way, as long as we work hard according to plan, we will surely exceed our own expectations.",
    },
  },
  5: {
    title: { vi: "Áp lực cuộc sống", en: "The pressure of life", zh: "生活的压力" },
    hanzi:
      "随着社会的发展，越来越多的人感到压力很大。有人通过运动来放松，有人则选择跟朋友聊天倾诉。无论采取什么方式，学会调节自己的情绪都是必要的。",
    pinyin:
      "Suízhe shèhuì de fāzhǎn, yuè lái yuè duō de rén gǎndào yālì hěn dà. Yǒu rén tōngguò yùndòng lái fàngsōng, yǒu rén zé xuǎnzé gēn péngyou liáotiān qīngsù. Wúlùn cǎiqǔ shénme fāngshì, xuéhuì tiáojié zìjǐ de qíngxù dōu shì bìyào de.",
    translation: {
      vi: "Cùng với sự phát triển của xã hội, ngày càng nhiều người cảm thấy áp lực rất lớn. Có người thư giãn bằng cách vận động, có người lại chọn tâm sự cùng bạn bè. Dù chọn cách nào, việc học cách điều chỉnh cảm xúc của bản thân đều là cần thiết.",
      en: "As society develops, more and more people feel a lot of pressure. Some relax through exercise, others choose to talk it out with friends. Whatever method is used, learning to regulate one's own emotions is necessary.",
    },
  },
  6: {
    title: { vi: "Truyền thống và hiện đại", en: "Tradition and modernity", zh: "传统与现代" },
    hanzi:
      "在快速发展的时代，传统文化难免受到冲击。然而，真正有价值的东西不会轻易被淘汰。如何在保守与创新之间找到平衡，是每个社会都要面对的课题。",
    pinyin:
      "Zài kuàisù fāzhǎn de shídài, chuántǒng wénhuà nánmiǎn shòudào chōngjī. Rán'ér, zhēnzhèng yǒu jiàzhí de dōngxi bú huì qīngyì bèi táotài. Rúhé zài bǎoshǒu yǔ chuàngxīn zhī jiān zhǎodào pínghéng, shì měi ge shèhuì dōu yào miànduì de kètí.",
    translation: {
      vi: "Trong thời đại phát triển nhanh chóng, văn hóa truyền thống khó tránh khỏi bị va chạm. Tuy nhiên, những thứ thực sự có giá trị sẽ không dễ dàng bị đào thải. Làm thế nào để tìm được sự cân bằng giữa bảo thủ và đổi mới là bài toán mà mọi xã hội đều phải đối mặt.",
      en: "In a rapidly developing era, traditional culture inevitably faces impact. However, things of real value are not easily discarded. How to find a balance between conservatism and innovation is a challenge every society must face.",
    },
  },
  "7-9": {
    title: { vi: "Bản chất của sự trưởng thành", en: "The essence of maturity", zh: "成熟的本质" },
    hanzi:
      "真正的成熟并非按部就班地完成人生的每个阶段，而是在饱经沧桑之后依然保持一颗善良而坚韧的心。那些本末倒置、只追求表面成功的人，往往在博大精深的人生课题面前显得不堪一击。",
    pinyin:
      "Zhēnzhèng de chéngshú bìngfēi ànbùjiùbān de wánchéng rénshēng de měi ge jiēduàn, ér shì zài bǎojīngcāngsāng zhīhòu yīrán bǎochí yì kē shànliáng ér jiānrèn de xīn. Nàxiē běnmòdàozhì, zhǐ zhuīqiú biǎomiàn chénggōng de rén, wǎngwǎng zài bódàjīngshēn de rénshēng kètí miànqián xiǎnde bùkānyījī.",
    translation: {
      vi: "Sự trưởng thành thực sự không phải là hoàn thành từng giai đoạn của cuộc đời một cách máy móc theo trình tự, mà là sau bao thăng trầm vẫn giữ được một trái tim lương thiện và kiên cường. Những người đảo lộn gốc ngọn, chỉ theo đuổi thành công bề ngoài, thường tỏ ra yếu ớt trước những bài học uyên thâm của cuộc đời.",
      en: "True maturity is not about mechanically completing each stage of life in order, but about retaining a kind and resilient heart after weathering life's ups and downs. Those who put the cart before the horse, chasing only superficial success, often prove fragile when facing life's profound lessons.",
    },
  },
};
