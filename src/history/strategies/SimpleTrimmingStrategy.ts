import { encoding_for_model } from '@dqbd/tiktoken';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { TrimmingStrategy } from './TrimmingStrategy.js';
import { TOKEN_MODEL } from '../../utils/config.js';

/**
 * A simple trimming strategy that removes the oldest user or assistant messages
 * until the total number of tokens is within the specified maximum limit.
 *
 * This strategy ensures that the system prompt is always retained.
 */
export class SimpleTrimmingStrategy implements TrimmingStrategy {
  /**
   * Trims the provided chat messages to ensure the total token count does not exceed the maximum allowed.
   *
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to be trimmed.
   * @param {number} maxTokens - The maximum allowed number of tokens for the chat history.
   * @returns {ChatCompletionMessageParam[]} A new array of trimmed chat messages.
   */
  trim(messages: ChatCompletionMessageParam[], maxTokens: number): ChatCompletionMessageParam[] {
    const encoding = encoding_for_model(TOKEN_MODEL);
    let totalTokens = this.calculateTokenCount(messages, encoding);

    // Continue trimming until totalTokens is within maxTokens or only the system prompt remains
    while (totalTokens > maxTokens && messages.length > 1) {
      // Remove the oldest user or assistant message (assumes the first message is the system prompt)
      messages.splice(1, 1); // Remove the message at index 1
      totalTokens = this.calculateTokenCount(messages, encoding);
    }

    encoding.free();
    return messages;
  }

  /**
   * Calculates the total number of tokens in the provided chat messages.
   *
   * @private
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages.
   * @param {any} encoding - The encoding instance used for tokenization.
   * @returns {number} The total number of tokens in the chat messages.
   */
  private calculateTokenCount(messages: ChatCompletionMessageParam[], encoding: any): number {
    const serializedMessages = messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');
    return encoding.encode(serializedMessages).length;
  }
}
