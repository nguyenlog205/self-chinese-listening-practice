import { Converter } from "opencc-js/cn2t";
import { p2z } from "pinyin-to-zhuyin";

// All seed data (backend + hsk_materials) is authored in Simplified Chinese, so
// the only conversion direction ever needed at display time is cn -> tw.
const simplifiedToTraditional = Converter({ from: "cn", to: "tw" });

const hanziCache = new Map();
const zhuyinCache = new Map();

export function toDisplayHanzi(hanzi, scriptMode) {
  if (!hanzi || scriptMode !== "traditional") return hanzi;
  let cached = hanziCache.get(hanzi);
  if (cached === undefined) {
    cached = simplifiedToTraditional(hanzi);
    hanziCache.set(hanzi, cached);
  }
  return cached;
}

export function toDisplayPhonetic(pinyin, phoneticMode) {
  if (!pinyin || phoneticMode !== "zhuyin") return pinyin;
  let cached = zhuyinCache.get(pinyin);
  if (cached === undefined) {
    cached = p2z(pinyin);
    zhuyinCache.set(pinyin, cached);
  }
  return cached;
}
