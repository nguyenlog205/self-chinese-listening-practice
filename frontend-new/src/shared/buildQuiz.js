// Builds a multiple-choice quiz (one question per word, 3 random distractors
// from the same word list) out of an already-fetched vocabulary array.
export function buildQuiz(words) {
  return words.map((word, index) => {
    const distractors = words
      .filter((_, i) => i !== index)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [word, ...distractors].sort(() => Math.random() - 0.5);
    return {
      question: word.hanzi,
      pinyin: word.pinyin,
      options,
      answer: word.hanzi,
    };
  });
}
