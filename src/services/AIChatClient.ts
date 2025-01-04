import OpenAI from 'openai';
import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from 'openai/src/resources/chat/completions.js';

import { ModelClientConfig, OpenRouterProviderPreferences } from '../types.js';

export class AIChatClient {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly providerPreferences?: OpenRouterProviderPreferences;
  private readonly temperature: number;
  private readonly n: number;

  constructor(config: ModelClientConfig) {
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });
    this.model = config.model;
    this.providerPreferences = config.providerPreferences;
    this.temperature = config.temperature ?? 0.2; // Default value
    this.n = config.n ?? 1; // Default value
  }

  public chat(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
    const params: ChatCompletionCreateParams & { provider?: OpenRouterProviderPreferences } = {
      messages: messages,
      model: this.model,
      temperature: this.temperature,
      n: this.n,
      ...(this.providerPreferences && { provider: this.providerPreferences }),
    };
    return this.openai.chat.completions.create(params);
  }

  /**
   * Summarizes an error message.
   * @param {string} error - The error message to summarize.
   * @returns {Promise<string>} The summarized error message.
   */
  public async summarizeError(error: string): Promise<string> {
    const summaryPrompt: ChatCompletionMessageParam = {
      role: 'system',
      content: `
        Summarize the following error message succinctly, focusing on the key issue and suggested action:
        "${error}"
      `,
    };

    const params: ChatCompletionCreateParams = {
      model: this.model,
      messages: [summaryPrompt],
    };

    const summaryResponse = await this.openai.chat.completions.create(params);
    return summaryResponse?.choices[0].message.content?.trim() || '';
  }
}
