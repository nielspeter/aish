import { ChatResponse, Message, Ollama } from 'ollama';
import { MODEL_SERVICE_HOST, MODEL_NAME, RESPONSE_MAX_TOKENS } from '../config.js';

/**
 * Class representing a client for interacting with the Ollama model.
 */
export class OllamaModelClient {
  private readonly ollama: Ollama;

  constructor(MODEL_SERVICE_HOST: string) {
    this.ollama = new Ollama({ host: MODEL_SERVICE_HOST });
  }

  /**
   * Gets a response from the model based on the provided messages.
   * @param {Message[]} messages - The messages to send to the model.
   * @returns {Promise<ChatResponse>} The model's response.
   */
  public async chat(messages: Message[]): Promise<ChatResponse> {
    return await this.ollama.chat({
      model: MODEL_NAME,
      messages,
      format: {
        type: 'object',
        properties: {
          reasoning: { type: 'string' },
          conclusion: { type: 'string' },
          command: { type: 'string' },
        },
        required: ['reasoning', 'conclusion'],
      },
      options: {
        temperature: 0.2,
        num_ctx: RESPONSE_MAX_TOKENS,
      },
    });
  }

  /**
   * Summarizes an error message.
   * @param {string} error - The error message to summarize.
   * @returns {Promise<string>} The summarized error message.
   */
  public async summarizeError(error: string): Promise<string> {
    const summaryPrompt = {
      role: 'system',
      content: `
        Summarize the following error message succinctly, focusing on the key issue and suggested action:
        "${error}"
      `,
    };

    const summaryResponse = await this.ollama.chat({
      model: MODEL_NAME,
      messages: [summaryPrompt],
      format: {
        type: 'string',
      },
    });

    return summaryResponse.message.content.trim();
  }
}
