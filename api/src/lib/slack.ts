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

// While testing, SLACK_DM_ALLOWLIST (comma-separated emails) limits who can receive DMs.
// Leave it unset to allow DMs to anyone.
function isDmAllowed(email: string): boolean {
  const allowlist = process.env.SLACK_DM_ALLOWLIST;
  if (!allowlist) return true;
  return allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

async function slackApi<T>(method: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://slack.com/api/${method}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`Slack ${method} failed: ${data.error}`);
  }
  return data as T;
}

// Sends a direct message from the bot to the Slack user with this email.
// Returns false if the message was skipped (no token, not allowlisted, no Slack account).
export async function sendSlackDM(email: string, text: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn("[slack] No bot token set, skipping DM.");
    return false;
  }

  if (!isDmAllowed(email)) {
    console.log(`[slack] ${email} is not in SLACK_DM_ALLOWLIST, skipping DM.`);
    return false;
  }

  let userId: string;
  try {
    const { user } = await slackApi<{ user: { id: string } }>(
      `users.lookupByEmail?email=${encodeURIComponent(email)}`,
      token
    );
    userId = user.id;
  } catch (err) {
    if (err instanceof Error && err.message.endsWith("users_not_found")) {
      console.warn(`[slack] No Slack user found for ${email}, skipping DM.`);
      return false;
    }
    throw err;
  }

  await slackApi("chat.postMessage", token, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: userId, text }),
  });
  return true;
}
