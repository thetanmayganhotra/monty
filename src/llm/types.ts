export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LLMCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  latencyMs: number;
}

/**
 * Every model provider (Groq today, others later) implements this.
 * Nothing in the workout engine or app code should import a provider
 * directly — only this interface.
 */
export interface LLMProvider {
  readonly name: string;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}
