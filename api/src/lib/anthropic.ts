import Anthropic from "@anthropic-ai/sdk";
import { sendSlackMessage } from "./slack";

// Reads ANTHROPIC_API_KEY from the environment
export const anthropic = new Anthropic();

export const CV_MODEL = process.env.CV_SCREENING_MODEL || "claude-opus-5-5";

// A problem with the account itself (no credits, bad key), not with one CV.
// Runs stop on it instead of marking every remaining CV as failed.
export class AiUnavailableError extends Error {}

// Last account-level problem, shown as a warning in the admin panel; cleared by the next successful call
export const aiStatus = { problem: null as string | null, since: null as Date | null };

function toAiUnavailable(err: unknown): AiUnavailableError | null {
  if (err instanceof Anthropic.AuthenticationError) {
    return new AiUnavailableError("The Anthropic API key is invalid or was revoked");
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new AiUnavailableError("The Anthropic API key isn't allowed to use this model");
  }
  // Billing problems have no dedicated error class; the API reports them as a 400 with this wording
  if (err instanceof Anthropic.APIError && /credit balance/i.test(err.message)) {
    return new AiUnavailableError("The Anthropic account is out of credits");
  }
  return null;
}

function reportAiProblem(problem: string) {
  const isNew = aiStatus.problem !== problem;
  aiStatus.problem = problem;
  aiStatus.since ??= new Date();
  if (!isNew) return;
  sendSlackMessage(
    `:warning: CV scanning stopped: ${problem}. Top up or fix it at https://console.anthropic.com, then run the scan again.`
  ).catch((err) => console.error("[ai] Failed to send Slack alert:", err));
}

export async function downloadCv(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CV download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// One call that returns JSON matching `schema`, reading the CV PDF alongside `text`
export async function askAboutCv<T>(opts: {
  system: string;
  schema: Record<string, unknown>;
  pdf: Buffer;
  text: string;
}): Promise<T> {
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropic.beta.messages.create({
      model: CV_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: opts.schema },
      },
      // System prompt is identical for every CV, so it's cached across a run
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: opts.pdf.toString("base64"),
              },
            },
            { type: "text", text: opts.text },
          ],
        },
      ],
    });
  } catch (err) {
    const unavailable = toAiUnavailable(err);
    if (unavailable) {
      reportAiProblem(unavailable.message);
      throw unavailable;
    }
    throw err;
  }
  aiStatus.problem = null;
  aiStatus.since = null;

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to read this CV");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The model's answer was cut off");
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as T;
}
