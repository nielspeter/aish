import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';

/**
 * Interface for trimming strategies.
 */
export interface TrimmingStrategy {
  /**
   * Trims the given messages to fit within the specified token limit.
   *
   * @param messages - The current array of messages.
   * @param maxTokens - The maximum allowed number of tokens.
   * @returns A promise that resolves to the trimmed array of messages.
   */
  trim(messages: ChatCompletionMessageParam[], maxTokens: number): ChatCompletionMessageParam[];
}
