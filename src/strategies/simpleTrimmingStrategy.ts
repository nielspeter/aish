import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';
import { TOKEN_MODEL } from '../config.js';
import { TrimmingStrategy } from './trimmingStrategy.js';
import { encoding_for_model } from '@dqbd/tiktoken';

export class SimpleTrimmingStrategy implements TrimmingStrategy {
  trim(messages: ChatCompletionMessageParam[], maxTokens: number): ChatCompletionMessageParam[] {
    const encoding = encoding_for_model(TOKEN_MODEL);
    let totalTokens = this.calculateTokenCount(messages, encoding);

    while (totalTokens > maxTokens && messages.length > 1) {
      // Keep at least system prompt
      messages.splice(1, 1); // Remove the oldest user/assistant message
      totalTokens = this.calculateTokenCount(messages, encoding);
    }

    encoding.free();
    return messages;
  }

  private calculateTokenCount(messages: ChatCompletionMessageParam[], encoding: any): number {
    const serializedMessages = messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');
    return encoding.encode(serializedMessages).length;
  }
}
