export async function sendSlackMessage(
  text: string,
  webhookUrl: string | undefined = process.env.SLACK_WEBHOOK_URL
): Promise<void> {
  if (!webhookUrl) {
    console.warn("[slack] No webhook URL set, skipping message.");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack message failed (${response.status}): ${body}`);
  }
}
