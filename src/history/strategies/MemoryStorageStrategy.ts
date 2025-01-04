import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { StorageStrategy } from './StorageStrategy.js';
import { SYS_PROMPT } from '../../utils/config.js';

export class MemoryStorageStrategy implements StorageStrategy {
  private messages: ChatCompletionMessageParam[] = [];

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

  async readHistory(): Promise<ChatCompletionMessageParam[]> {
    return this.messages;
  }

  async writeHistory(messages: ChatCompletionMessageParam[]): Promise<void> {
    this.messages = messages;
  }
}
