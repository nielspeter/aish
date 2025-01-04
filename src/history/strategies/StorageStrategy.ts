import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

/**
 * Interface representing a storage strategy for managing chat history.
 * Implementations of this interface handle the initialization, reading, and writing of chat messages.
 */
export interface StorageStrategy {
  /**
   * Initializes the storage system.
   * This method is typically called when the application starts to load existing chat history.
   *
   * @returns {Promise<ChatCompletionMessageParam[]>} A promise that resolves to an array of chat messages.
   */
  init(): Promise<ChatCompletionMessageParam[]>;

  /**
   * Reads the existing chat history from the storage.
   * This method retrieves all previously stored chat messages.
   *
   * @returns {Promise<ChatCompletionMessageParam[]>} A promise that resolves to an array of chat messages.
   */
  readHistory(): Promise<ChatCompletionMessageParam[]>;

  /**
   * Writes the provided chat messages to the storage.
   * This method persists the current state of chat messages, typically after adding new messages.
   *
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to be stored.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  writeHistory(messages: ChatCompletionMessageParam[]): Promise<void>;
}
