import fs from 'fs/promises';
import { homedir } from 'os';
import path from 'path';

import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { StorageStrategy } from './StorageStrategy.js';
import { SYS_PROMPT } from '../../utils/config.js';

/**
 * FileStorageStrategy is a concrete implementation of the StorageStrategy interface.
 *
 * This strategy handles the persistence of chat messages by reading from and writing
 * to a JSON file located in the user's home directory. It ensures that the chat history
 * is maintained across different sessions of the application.
 */
export class FileStorageStrategy implements StorageStrategy {
  private readonly HISTORY_FILE_PATH = path.join(homedir(), '.aish_history.json');

  /**
   * Initializes the storage by loading existing chat history.
   *
   * @returns {Promise<ChatCompletionMessageParam[]>} A promise that resolves to an array of chat messages.
   */
  async init(): Promise<ChatCompletionMessageParam[]> {
    return this.readHistory();
  }

  /**
   * Reads the existing chat history from the storage file.
   *
   * @returns {Promise<ChatCompletionMessageParam[]>} A promise that resolves to an array of chat messages.
   */
  async readHistory(): Promise<ChatCompletionMessageParam[]> {
    try {
      const data = await fs.readFile(this.HISTORY_FILE_PATH, 'utf-8');
      return JSON.parse(data) as ChatCompletionMessageParam[];
    } catch (error) {
      // If the file doesn't exist or there's an error, return an array with the system prompt
      return [
        {
          role: 'system',
          content: SYS_PROMPT,
        },
      ];
    }
  }

  /**
   * Writes the provided chat messages to the storage file.
   *
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to be stored.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  async writeHistory(messages: ChatCompletionMessageParam[]): Promise<void> {
    try {
      const data = JSON.stringify(messages, null, 2);
      await fs.writeFile(this.HISTORY_FILE_PATH, data, { encoding: 'utf-8' });
    } catch (error) {
      console.error(`Failed to write messages to file: ${error instanceof Error ? error.message : error}`);
    }
  }
}
