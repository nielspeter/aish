import { encoding_for_model } from '@dqbd/tiktoken';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/src/resources/chat/completions.js';

import { HISTORY_MAX_TOKENS, TOKEN_MODEL } from '../utils/config.js';
import { StorageStrategy } from './strategies/StorageStrategy.js';
import { TrimmingStrategy } from './strategies/TrimmingStrategy.js';

/**
 * HistoryManager is responsible for managing the chat history within the application.
 *
 * It handles the initialization, addition, trimming, and persistence of chat messages.
 * The class ensures that the chat history remains within a specified token limit to maintain
 * optimal performance and relevance of the conversation context.
 */
export class HistoryManager {
  /**
   * An array storing the chat messages.
   */
  private messages: ChatCompletionMessageParam[] = [];

  /**
   * The storage strategy used for persisting and retrieving chat history.
   */
  private readonly storageStrategy: StorageStrategy;

  /**
   * The trimming strategy used for managing the size of the chat history.
   */
  private readonly trimmingStrategy: TrimmingStrategy;

  /**
   * Creates an instance of HistoryManager.
   *
   * @param {StorageStrategy} storageStrategy - The strategy for storing and retrieving chat history.
   * @param {TrimmingStrategy} trimmingStrategy - The strategy for trimming chat history based on token limits.
   */
  constructor(storageStrategy: StorageStrategy, trimmingStrategy: TrimmingStrategy) {
    this.storageStrategy = storageStrategy;
    this.trimmingStrategy = trimmingStrategy;
  }

  /**
   * Initializes the history by loading existing messages using the storage strategy.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  async init(): Promise<void> {
    this.messages = await this.storageStrategy.init();
  }

  /**
   * Retrieves the current chat history.
   *
   * @returns {ChatCompletionMessageParam[]} A cloned array of chat messages.
   */
  get history(): ChatCompletionMessageParam[] {
    return [...this.messages];
  }

  /**
   * Adds a new message to the chat history, trims the history if necessary, and persists the updated history.
   *
   * @async
   * @param {ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam} message
   *        The chat message to add to the history.
   *
   * @returns {Promise<void>} A promise that resolves when the message has been added and the history has been updated.
   */
  async addToHistory(
    message: ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam
  ): Promise<void> {
    this.messages.push(message);
    await this.trimMessagesToFitContext();
    await this.storageStrategy.writeHistory(this.messages);
  }

  /**
   * Calculates the total number of tokens in the current chat messages.
   *
   * @returns {number} The total number of tokens in the chat history.
   */
  calculateTokenCount(): number {
    try {
      const encoding = encoding_for_model(TOKEN_MODEL);

      // Serialize and preprocess messages
      const serializedMessages = this.messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');

      // Tokenize and count tokens
      const tokenCount = encoding.encode(serializedMessages).length;
      encoding.free();

      return tokenCount;
    } catch (error) {
      console.error('Error processing text:', error);
      return 0;
    }
  }

  /**
   * Trims the chat history to ensure the total token count does not exceed the maximum allowed.
   *
   * @private
   * @param {number} [maxTokens=HISTORY_MAX_TOKENS] - The maximum allowed number of tokens for the chat history.
   *
   * @returns {Promise<void>} A promise that resolves when the trimming operation is complete.
   */
  private async trimMessagesToFitContext(maxTokens: number = HISTORY_MAX_TOKENS): Promise<void> {
    this.messages = this.trimmingStrategy.trim([...this.messages], maxTokens);
  }
}
