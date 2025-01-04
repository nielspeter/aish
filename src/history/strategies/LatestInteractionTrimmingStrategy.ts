import { encoding_for_model } from '@dqbd/tiktoken';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { TrimmingStrategy } from './TrimmingStrategy.js';
import { SYS_PROMPT, TOKEN_MODEL } from '../../utils/config.js';

/**
 * A trimming strategy that ensures:
 * 1. The total tokens do not exceed the maximum allowed by removing oldest messages first.
 * 2. Retains the system prompt, the latest user message, and the assistant's response to that user message.
 * 3. If retaining only these three messages still exceeds maxTokens, it's acceptable.
 */
export class LatestInteractionTrimmingStrategy implements TrimmingStrategy {
  /**
   * Trims the provided chat messages to ensure the total token count does not exceed the maximum allowed.
   *
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to be trimmed.
   * @param {number} maxTokens - The maximum allowed number of tokens for the chat history.
   * @returns {ChatCompletionMessageParam[]} A new array of trimmed chat messages.
   */
  trim(messages: ChatCompletionMessageParam[], maxTokens: number): ChatCompletionMessageParam[] {
    const messagesCopy = [...messages]; // Clone the array

    if (!messagesCopy || messagesCopy.length === 0) {
      // If no messages are provided, initialize with the system prompt.
      return [
        {
          role: 'system',
          content: SYS_PROMPT,
        },
      ];
    }

    // Ensure that the first message is the system prompt.
    const systemPromptIndex = messagesCopy.findIndex((msg) => msg.role === 'system');
    if (systemPromptIndex === -1) {
      throw new Error('System prompt is missing in the provided messages.');
    }

    const encoding = encoding_for_model(TOKEN_MODEL);
    let totalTokens = this.calculateTokenCount(messagesCopy, encoding);

    // If total tokens are within the limit, return all messages.
    if (totalTokens <= maxTokens) {
      encoding.free();
      return messagesCopy;
    }

    // 1. Trim messages by removing oldest non-system messages until:
    //    a) totalTokens <= maxTokens, or
    //    b) only system prompt, latest user, and assistant response remain.
    while (totalTokens > maxTokens && messagesCopy.length > 3) {
      // Remove the oldest message after the system prompt.
      const removeIndex = systemPromptIndex === 0 ? 1 : 0;
      messagesCopy.splice(removeIndex, 1);
      totalTokens = this.calculateTokenCount(messagesCopy, encoding);
    }

    // After trimming, check if trimming was necessary
    // If trimming was not necessary (i.e., all messages are already within limit), return all messages
    // Else, retain only system prompt, latest user message, and assistant response
    if (totalTokens <= maxTokens) {
      encoding.free();
      return messagesCopy;
    }

    // 2. Retain only the system prompt, the latest user message, and its assistant response (if any).
    const finalMessages: ChatCompletionMessageParam[] = [];

    // Always include the system prompt.
    const systemPrompt = messagesCopy.find((msg) => msg.role === 'system');
    if (systemPrompt) {
      finalMessages.push(systemPrompt);
    } else {
      // If the system prompt was somehow removed, re-add it.
      finalMessages.push({
        role: 'system',
        content: SYS_PROMPT,
      });
    }

    // Find the index of the last user message.
    const lastUserMessageIndex = messagesCopy
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.role === 'user')
      .map(({ idx }) => idx)
      .pop();

    if (lastUserMessageIndex !== undefined) {
      // Add the latest user message.
      const latestUserMessage = messagesCopy[lastUserMessageIndex];
      finalMessages.push(latestUserMessage);

      // Check if there's an assistant response immediately following the latest user message.
      const maybeAssistant = messagesCopy[lastUserMessageIndex + 1];
      if (maybeAssistant && maybeAssistant.role === 'assistant') {
        finalMessages.push(maybeAssistant);
      }
    }

    // Always free the encoding instance
    encoding.free();

    return finalMessages;
  }

  /**
   * Calculates the total number of tokens in the provided chat messages.
   *
   * @private
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages.
   * @param {ReturnType<typeof encoding_for_model>} encoding - The encoding instance used for tokenization.
   * @returns {number} The total number of tokens in the chat messages.
   */
  private calculateTokenCount(
    messages: ChatCompletionMessageParam[],
    encoding: ReturnType<typeof encoding_for_model>
  ): number {
    // Serialize the conversation in a format suitable for token counting.
    const serialized = messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');
    return encoding.encode(serialized).length;
  }
}
