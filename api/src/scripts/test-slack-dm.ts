// Sends a test DM via the Slack bot.
// Usage: npx tsx src/scripts/test-slack-dm.ts you@example.com
import "dotenv/config";
import { sendSlackDM } from "../lib/slack";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx src/scripts/test-slack-dm.ts <email>");
    process.exit(1);
  }

  const sent = await sendSlackDM(email, ":wave: Test message from the SoftwareYard API.");
  console.log(sent ? `Sent DM to ${email}` : `DM to ${email} was skipped (see warnings above)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
