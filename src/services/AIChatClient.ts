import OpenAI from 'openai';
import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from 'openai/src/resources/chat/completions.js';

import { ModelClientConfig, OpenRouterProviderPreferences } from '../types.js';
import { AI_CHAT_CLIENT_RESPONSE_LOGGING } from '../utils/config.js';

/**
 * AIChatClient is responsible for interacting with the OpenAI Chat Completion API.
 */
export class AIChatClient {
  /**
   * Instance of the OpenAI client used to communicate with the API.
   */
  private readonly openai: OpenAI;

  /**
   * The AI model to be used for generating chat completions.
   */
  private readonly model: string;

  /**
   * OpenRouter optional provider-specific preferences.
   */
  private readonly openRouterProviderPreferences?: OpenRouterProviderPreferences;

  /**
   * Controls the randomness of the AI's responses.
   * Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
   */
  private readonly temperature: number;

  /**
   * The number of completions to generate for each prompt.
   */
  private readonly n: number;

  /**
   * Creates an instance of AIChatClient.
   *
   * @param {ModelClientConfig} config - Configuration object for initializing the AIChatClient.
   */
  constructor(config: ModelClientConfig) {
    this.openai = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });
    this.model = config.model;
    this.openRouterProviderPreferences = config.openRouterProviderPreferences;
    this.temperature = config.temperature ?? 0.2; // Default value
    this.n = config.n ?? 1; // Default value
  }

  /**
   * Sends a chat completion request to the OpenAI API.
   *
   * This method takes an array of chat messages and returns a promise that resolves to the AI's response.
   * It configures the request parameters based on the client's settings.
   *
   * @param {ChatCompletionMessageParam[]} messages - An array of chat messages to send to the AI.
   * @returns {Promise<ChatCompletion>} A promise that resolves to the chat completion response from the AI.
   */
  public async chat(messages: ChatCompletionMessageParam[]): Promise<ChatCompletion> {
    const params: ChatCompletionCreateParams & { provider?: OpenRouterProviderPreferences } = {
      messages: messages,
      model: this.model,
      temperature: this.temperature,
      n: this.n,
      ...(this.openRouterProviderPreferences && { provider: this.openRouterProviderPreferences }),
    };

    if (AI_CHAT_CLIENT_RESPONSE_LOGGING) {
      console.log('Chat Request Params:', params);

      // Using .withResponse() to access both the raw Response and parsed data
      const { data: chatCompletion, response: rawResponse } = await this.openai.chat.completions
        .create(params)
        .withResponse();

      // Log raw response details
      console.log('Raw Response Headers:', Array.from(rawResponse.headers.entries()));
      console.log('Raw Response Status:', rawResponse.status, rawResponse.statusText);

      // Log parsed response data
      console.log('Parsed Response Data:', chatCompletion);

      return chatCompletion;
    } else {
      return this.openai.chat.completions.create(params);
    }
  }

  /**
   * Summarizes an error message using the AI model.
   *
   * This method sends the error message to the AI with a prompt to summarize it, focusing on the key issue
   * and suggested actions. It returns the summarized version of the error message.
   *
   * @async
   * @param {string} error - The error message to summarize.
   * @returns {Promise<string>} A promise that resolves to the summarized error message.
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
    return summaryResponse?.choices[0].message.content?.trim() ?? '';
  }
}
