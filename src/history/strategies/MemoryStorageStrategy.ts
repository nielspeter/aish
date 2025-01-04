import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { StorageStrategy } from './StorageStrategy.js';
import { SYS_PROMPT } from '../../utils/config.js';

/**
 * Implements an in-memory storage strategy for managing chat history.
 *
 * This strategy stores all chat messages in memory, starting with a predefined system prompt.
 */
export class MemoryStorageStrategy implements StorageStrategy {
  /**
   * Array to hold chat messages in memory.
   *
   * @type {ChatCompletionMessageParam[]}
   * @private
   */
  private messages: ChatCompletionMessageParam[] = [];

  /**
   * Initializes the in-memory storage with a system prompt.
   *
   * This method sets up the initial state of the chat history by adding a system message.
   * It is typically called when the application starts to prepare the chat environment.
   *
   * @async
   * @returns {Promise<ChatCompletionMessageParam[]>}
   * A promise that resolves to the initialized array of chat messages.
   */
  async init(): Promise<ChatCompletionMessageParam[]> {
    // Initialize with system prompt
    this.messages = [
      {
        role: 'system',
        content: SYS_PROMPT,
      },
    ];
    return this.messages;
  }

  /**
   * Retrieves the current chat history stored in memory.
   *
   * This method returns all chat messages that have been stored since initialization.
   *
   * @async
   * @returns {Promise<ChatCompletionMessageParam[]>}
   * A promise that resolves to the array of stored chat messages.
   */
  async readHistory(): Promise<ChatCompletionMessageParam[]> {
    return this.messages;
  }

  /**
   * Updates the in-memory storage with the provided chat messages.
   *
   * This method replaces the existing chat history with the new set of messages.
   * It is typically called after adding new messages to ensure the storage reflects the latest state.
   *
   * @async
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to be stored.
   * @returns {Promise<void>}
   * A promise that resolves once the chat history has been successfully updated.
   */
  async writeHistory(messages: ChatCompletionMessageParam[]): Promise<void> {
    this.messages = messages;
  }
}
