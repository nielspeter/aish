import { MODEL_NAME, RESPONSE_MAX_TOKENS } from '../config.js';
import { Message } from 'ollama';

// Define interfaces within the same file
export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  format?: object;
}

export interface ContentFilterResults {
  hate: { filtered: boolean };
  self_harm: { filtered: boolean };
  sexual: { filtered: boolean };
  violence: { filtered: boolean };
  jailbreak: { filtered: boolean; detected: boolean };
  profanity: { filtered: boolean; detected: boolean };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
    content_filter_results: ContentFilterResults;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: any | null;
    completion_tokens_details?: any | null;
  };
  system_fingerprint?: string;
}

export class LambdaLabModelClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async chat(messages: Message[]): Promise<ChatCompletionResponse> {
    const requestPayload = this.createChatRequestPayload(messages);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${this.apiUrl}: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ChatCompletionResponse;
  }

  private createChatRequestPayload(messages: Message[]): ChatCompletionRequest {
    return {
      model: MODEL_NAME,
      messages,
      temperature: 0.2,
      maxTokens: RESPONSE_MAX_TOKENS,
      format: {
        type: 'object',
        properties: {
          reasoning: { type: 'string' },
          conclusion: { type: 'string' },
          command: { type: 'string', nullable: true },
        },
        required: ['reasoning', 'conclusion'],
        additionalProperties: false,
      },
    };
  }

  async summarizeError(errorText: string): Promise<string> {
    const summaryPrompt = [
      {
        role: 'system',
        content: `Summarize the following error message succinctly, focusing on the key issue and suggested action:\n"${errorText}"`,
      },
    ];

    const summaryResponse = await this.chat(summaryPrompt);
    return summaryResponse.choices[0]?.message?.content ?? '';
  }
}
