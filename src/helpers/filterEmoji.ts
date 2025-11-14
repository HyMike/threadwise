import { ThreadMessage } from "@/clients/slack";

export const filterHasEmoji = (
  message: ThreadMessage,
  emoji: string
): boolean => {
  if (!message?.reactions || message.reactions.length === 0) {
    return false;
  }
  return message.reactions.some((reaction) => reaction.name == emoji);
};
