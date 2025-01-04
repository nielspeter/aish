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

export class HistoryManager {
  private messages: ChatCompletionMessageParam[] = [];
  private readonly storageStrategy: StorageStrategy;
  private readonly trimmingStrategy: TrimmingStrategy;

  constructor(storageStrategy: StorageStrategy, trimmingStrategy: TrimmingStrategy) {
    this.storageStrategy = storageStrategy;
    this.trimmingStrategy = trimmingStrategy;
  }

  /**
   * Initializes the history by loading existing messages using the storage strategy.
   */
  async init() {
    this.messages = await this.storageStrategy.init();
  }

  get history() {
    return [...this.messages];
  }

  /**
   * Adds a message to the history, applies trimming if necessary, and persists the history.
   *
   * @param message - The message to add.
   */
  async addToHistory(
    message: ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam
  ) {
    this.messages.push(message);
    this.trimMessagesToFitContext();
    await this.storageStrategy.writeHistory(this.messages);
  }

  /**
   * Calculates the total number of tokens in the current messages.
   *
   * @returns The total token count.
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
   * Trims messages to ensure the total token count does not exceed the maximum allowed.
   */
  private trimMessagesToFitContext(maxTokens: number = HISTORY_MAX_TOKENS) {
    this.messages = this.trimmingStrategy.trim([...this.messages], maxTokens);
  }
}
