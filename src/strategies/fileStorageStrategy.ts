import { StorageStrategy } from './storageStrategy.js';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { SYS_PROMPT } from '../config.js';

export class FileStorageStrategy implements StorageStrategy {
  private readonly HISTORY_FILE_PATH = path.join(homedir(), '.aish_history.json');

  async init(): Promise<ChatCompletionMessageParam[]> {
    return this.readHistory();
  }

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

  async writeHistory(messages: ChatCompletionMessageParam[]): Promise<void> {
    try {
      const data = JSON.stringify(messages, null, 2);
      await fs.writeFile(this.HISTORY_FILE_PATH, data, { encoding: 'utf-8' });
    } catch (error) {
      console.error(`Failed to write messages to file: ${error.message}`);
    }
  }
}
