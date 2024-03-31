import { BLACK_LIST_CHAT_WORDS } from '../constants/blackList.js';

export function validateMessage(message) {
  const blacklist = BLACK_LIST_CHAT_WORDS.map(
    (item) => new RegExp(`\\b${item.toLowerCase()}\\b`)
  );

  return !blacklist.some((word) => word.test(message.toLowerCase()));
}
