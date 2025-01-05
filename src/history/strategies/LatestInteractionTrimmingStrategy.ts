import { encoding_for_model } from '@dqbd/tiktoken';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { TrimmingStrategy } from './TrimmingStrategy.js';
import { SYS_PROMPT, TOKEN_MODEL } from '../../utils/config.js';

/**
 * A trimming strategy that ensures:
 * 1. The system prompt is always present.
 * 2. The total tokens do not exceed the maximum allowed by removing oldest messages first (excluding system).
 * 3. If trimming down to only three messages (system prompt, last user message, and the final assistant message) still exceeds `maxTokens`, it is returned anyway.
 *
 * This strategy specifically retains:
 * - The system prompt,
 * - The last user message in the conversation,
 * - The final assistant message that appears after that user message (even if there are multiple assistant messages in a row).
 */
export class LatestInteractionTrimmingStrategy implements TrimmingStrategy {
  /**
   * Trims an array of chat messages to keep the total token count within `maxTokens`.
   *
   * **Algorithm**:
   *  1. Identify the last user message and the truly last assistant message after it **before** any splicing.
   *  2. Try removing the oldest messages (excluding the system prompt) until we fit in `maxTokens` or have just 3 messages left.
   *  3. If we still exceed `maxTokens`, discard everything except:
   *     - The system prompt,
   *     - The **original** last user message,
   *     - The **original** last assistant message after that user.
   *
   * @param {ChatCompletionMessageParam[]} messages - The array of messages to trim.
   * @param {number} maxTokens - The maximum allowed number of tokens for the chat history.
   * @returns {ChatCompletionMessageParam[]} A **new** array of trimmed messages.
   * @throws Will throw an error if the system prompt is missing from the original message array.
   */
  trim(messages: ChatCompletionMessageParam[], maxTokens: number): ChatCompletionMessageParam[] {
    // Clone the original array for safe splicing
    const messagesCopy = [...messages];

    // If no messages are provided, return just the system prompt.
    if (messagesCopy.length === 0) {
      return [
        {
          role: 'system',
          content: SYS_PROMPT,
        },
      ];
    }

    // Check if the system prompt is present.
    const systemPromptIndex = messagesCopy.findIndex((msg) => msg.role === 'system');
    if (systemPromptIndex === -1) {
      throw new Error('System prompt is missing in the provided messages.');
    }

    // ---- STEP 1: Identify the truly last user and last assistant AFTER that user (in the original array).
    const originalLastUserIndex = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.role === 'user')
      .map(({ idx }) => idx)
      .pop();

    // For the last assistant, find the highest index that is > originalLastUserIndex
    let originalLastAssistantIndex: number | undefined = undefined;
    if (originalLastUserIndex !== undefined) {
      originalLastAssistantIndex = messages
        .map((msg, idx) => ({ msg, idx }))
        .filter(({ msg, idx }) => msg.role === 'assistant' && idx > originalLastUserIndex)
        .map(({ idx }) => idx)
        .pop();
    }

    // We'll need these references in case we must do the final fallback in step 3.

    // ---- STEP 2: Attempt to trim within maxTokens by removing oldest non-system messages.

    // Create an encoder and compute total tokens.
    const encoding = encoding_for_model(TOKEN_MODEL);
    let totalTokens = this.calculateTokenCount(messagesCopy, encoding);

    // If total tokens are within `maxTokens`, we are done.
    if (totalTokens <= maxTokens) {
      encoding.free();
      return messagesCopy;
    }

    // Remove messages from the start (excluding system) until we're <= maxTokens,
    // or we have only 3 messages left (we want to preserve system, user, assistant).
    while (totalTokens > maxTokens && messagesCopy.length > 3) {
      // Remove the oldest message that isn't the system prompt.
      const removeIndex = systemPromptIndex === 0 ? 1 : 0;
      messagesCopy.splice(removeIndex, 1);

      // Recalculate token count.
      totalTokens = this.calculateTokenCount(messagesCopy, encoding);
    }

    // If at this point we fit within maxTokens, return the trimmed array as is.
    if (totalTokens <= maxTokens) {
      encoding.free();
      return messagesCopy;
    }

    // ---- STEP 3: We still exceed maxTokens.
    // Keep only system prompt, the original last user, and the original last assistant after that user.
    // We'll reconstruct from the original `messages` array to ensure we didn't accidentally remove them.

    const finalMessages: ChatCompletionMessageParam[] = [];

    // Always keep the system prompt
    const systemPrompt = messages.find((m) => m.role === 'system');
    if (systemPrompt) {
      finalMessages.push(systemPrompt);
    } else {
      // If it somehow doesn't exist, re-add from config
      finalMessages.push({
        role: 'system',
        content: SYS_PROMPT,
      });
    }

    // Add the original last user message, if it exists
    if (originalLastUserIndex !== undefined) {
      finalMessages.push(messages[originalLastUserIndex]);
    }

    // Add the original last assistant message, if it exists
    if (originalLastAssistantIndex !== undefined) {
      finalMessages.push(messages[originalLastAssistantIndex]);
    }

    // Clean up the encoder
    encoding.free();

    return finalMessages;
  }

  /**
   * Calculates the total number of tokens for a given array of messages.
   * We serialize messages by prefixing each with `<|role|>` before the content, then measure the token length.
   *
   * @private
   * @param {ChatCompletionMessageParam[]} messages - The array of chat messages to measure.
   * @param {ReturnType<typeof encoding_for_model>} encoding - The encoder instance used for tokenization.
   * @returns {number} The total count of tokens in the provided messages.
   */
  private calculateTokenCount(
    messages: ChatCompletionMessageParam[],
    encoding: ReturnType<typeof encoding_for_model>
  ): number {
    // Simple serialization approach: prefix role tags and join.
    const serialized = messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');
    return encoding.encode(serialized).length;
  }
}
