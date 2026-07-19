import { lazy } from "react";

const DictationPractice = lazy(() => import("./components/DictationPractice"));
const ChoiceListening = lazy(() => import("./components/ChoiceListening"));
const OrderListening = lazy(() => import("./components/OrderListening"));
const DialogueChoice = lazy(() => import("./components/DialogueChoice"));
const DialogueCloze = lazy(() => import("./components/DialogueCloze"));
const SentenceDictation = lazy(() => import("./components/SentenceDictation"));
const YoutubeListening = lazy(() => import("./components/YoutubeListening"));

// Two-level menu for the "Luyện nghe" page: a group (word-level vs.
// sentence/dialogue-level practice), then a mode within that group.
//
// To add a new mode: create its component under ./components, add one
// entry to the relevant group's `sections` array, then add matching
// `listening.tab.<key>` / `listening.menu.<key>` translations in
// i18n/translations.js. To add a whole new group: add an entry here with
// its own `sections`, plus `listening.group.<key>.title` /
// `listening.group.<key>.desc` translations. Nothing else needs to change.
export const GROUPS = [
  {
    key: "word",
    icon: "字",
    sections: [
      { key: "dictation", icon: "键", component: DictationPractice },
      { key: "choice", icon: "选", component: ChoiceListening },
      { key: "order", icon: "序", component: OrderListening },
    ],
  },
  {
    key: "sentence",
    icon: "话",
    sections: [
      { key: "sentenceDictation", icon: "写", component: SentenceDictation },
      { key: "dialogueChoice", icon: "问", component: DialogueChoice },
      { key: "dialogueCloze", icon: "空", component: DialogueCloze },
      { key: "youtube", icon: "▶", component: YoutubeListening },
    ],
  },
];
