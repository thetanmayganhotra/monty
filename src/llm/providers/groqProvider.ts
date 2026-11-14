import Groq from "groq-sdk";
import type {
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMProvider,
} from "../types";

/**
 * Smallest general-purpose chat model in Groq's current catalog (checked
 * live via GET /openai/v1/models — Groq has since retired the Llama 3.x
 * chat models this was originally written against). Chosen for the
 * interaction checkpoints that happen mid-session (intent parsing,
 * weight/rep logging, mood classification) where latency matters more
 * than raw reasoning depth, and it supports json_mode/structured outputs
 * for the parsing use cases. Swap via GroqProvider's `model` constructor
 * option if a task needs more capability (e.g. daily plan-copy generation
 * could use openai/gpt-oss-120b without touching callers, since they only
 * see LLMProvider).
 */
export const GROQ_FAST_MODEL = "openai/gpt-oss-20b";

export interface GroqProviderOptions {
  apiKey: string;
  model?: string;
}

export class GroqProvider implements LLMProvider {
  readonly name = "groq";
  private client: Groq;
  private model: string;

  constructor(options: GroqProviderOptions) {
    if (!options.apiKey) {
      throw new Error("GroqProvider requires an apiKey");
    }
    // The SDK refuses to run with a raw key in any browser-like JS
    // environment by default (RN Web included) — a real safety net,
    // since it means this key is sitting in a client bundle. We're
    // overriding it because that's still true today (no backend yet):
    // this app calls Groq directly from the client for prototyping.
    // Before shipping, this call must move behind a backend/edge
    // function so GROQ_API_KEY never reaches a device at all.
    this.client = new Groq({ apiKey: options.apiKey, dangerouslyAllowBrowser: true });
    this.model = options.model ?? GROQ_FAST_MODEL;
  }

  async complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.4,
      max_tokens: request.maxTokens ?? 512,
      response_format: request.jsonMode ? { type: "json_object" } : undefined,
      // gpt-oss-20b is a reasoning model — it burns completion tokens on
      // hidden chain-of-thought before the real answer, which was eating
      // the whole max_tokens budget and truncating short JSON replies.
      // "none" isn't accepted by this model (400s); "low" is the minimum
      // it allows. Callers should still budget generous maxTokens for
      // short answers to leave room for that reasoning overhead.
      reasoning_effort: "low",
    });

    const content = response.choices[0]?.message?.content ?? "";

    return {
      content,
      model: this.model,
      latencyMs: Date.now() - start,
    };
  }
}
