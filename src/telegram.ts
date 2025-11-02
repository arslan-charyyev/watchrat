import retry from "p-retry";
import { appConfig } from "./config.ts";

export function sendMessage(message: string) {
  const shortMessage = message.replaceAll("\n", " ").substring(0, 100);
  console.log(`    Sending Telegram notification: ${shortMessage}...`);

  const { botToken, recipientId } = appConfig.telegram;
  return retry(() =>
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: recipientId,
        text: message.substring(0, 1000), // Bots have limited message length
      }),
    })
  );
}

export const telegramBot = {
  sendMessage,
};
