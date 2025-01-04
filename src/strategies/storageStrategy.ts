import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';

export interface StorageStrategy {
  init(): Promise<ChatCompletionMessageParam[]>;
  readHistory(): Promise<ChatCompletionMessageParam[]>;
  writeHistory(messages: ChatCompletionMessageParam[]): Promise<void>;
}
