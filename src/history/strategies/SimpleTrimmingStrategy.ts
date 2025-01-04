import { encoding_for_model } from '@dqbd/tiktoken';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';

import { TrimmingStrategy } from './TrimmingStrategy.js';
import { TOKEN_MODEL } from '../../utils/config.js';

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
