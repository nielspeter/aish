import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { MAX_TOKENS, TOKEN_MODEL, SYS_PROMPT } from './config.js';
import { Message } from 'ollama';
import { encoding_for_model } from '@dqbd/tiktoken';
import { homedir } from 'os';
import { MessageContent } from './types';

/**
 * Path to the hidden messages file in the user's home directory.
 */
export const MESSAGES_FILE_PATH = path.join(homedir(), '.aish_messages.json');

export class MessageHelper {
  messages: Message[] = [];

  async init() {
    // Initialize messages by reading from the hidden file
    this.messages = await this.readMessagesFromFile();
  }

  /**
   * Adds a message to the history and writes it to the hidden messages file.
   *
   * @param message
   */
  async addToHistory(message: Message) {
    this.messages.push(message);
    this.trimMessagesToFitContext();
    await this.writeMessagesToFile();
    //console.log(chalk.yellow(`[${message.role}] ${message.content.replaceAll('\n', ' ')}`));
  }

  /**
   * Calculates the total number of tokens in the given this.messages.
   *
   * @param {number} [contextLimit=MAX_TOKENS] - The maximum token limit for context.
   * @returns {number} - The total number of tokens.
   */
  calculateTokenCount(contextLimit: number = MAX_TOKENS): number {
    try {
      const encoding = encoding_for_model(TOKEN_MODEL);

      // Serialize and preprocess messages
      const serializedMessages = this.messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');

      // Tokenize and count tokens
      const tokenCount = encoding.encode(serializedMessages).length;
      encoding.free();

      return tokenCount;
    } catch (error) {
      console.error('Error processing text:', error);
      return 0;
    }
  }

  /**
   * Trims the messages array to fit within the maximum token limit.
   * Summarizes older messages instead of removing them outright.
   *
   * @param {number} maxTokens - The maximum number of tokens allowed.
   */
  private trimMessagesToFitContext(maxTokens: number = MAX_TOKENS) {
    // Exclude specific indices from trimming
    const excludeIndices = new Set<number>();
    if (this.messages.length > 0) {
      excludeIndices.add(0); // Exclude system prompt (first message)
      excludeIndices.add(this.messages.length - 1); // Exclude most recent message
    }

    // Proactively trim all messages except excluded ones
    for (let i = 1; i < this.messages.length - 1; i++) {
      if (!excludeIndices.has(i)) {
        this.trimMessageContent(this.messages[i]);
      }
    }

    // Calculate the total token count after trimming
    let totalTokens = this.calculateTokenCount();

    // If still over the limit, perform iterative trimming
    let index = 1;
    while (totalTokens > maxTokens && index < this.messages.length - 1) {
      if (!excludeIndices.has(index)) {
        this.messages[index].content = this.trimStringKeepHeadAndTail(this.messages[index].content, 200); // Further reduce size
        totalTokens = this.calculateTokenCount();
      }
      index++;
    }
  }

  private trimStringKeepHeadAndTail(str: string, maxLength = 1000): string {
    if (str.length <= maxLength) {
      return str; // No trimming needed
    }

    const ellipsis = '...';
    const charsToKeep = maxLength - ellipsis.length;
    const headLength = Math.ceil(charsToKeep / 2);
    const tailLength = Math.floor(charsToKeep / 2);

    return `${str.slice(0, headLength)}${ellipsis}${str.slice(-tailLength)}`;
  }

  /**
   * Reads messages from the hidden messages file.
   * @returns {Promise<Message[]>} The array of this.messages.
   */
  private async readMessagesFromFile(): Promise<Message[]> {
    try {
      const data = await fs.readFile(MESSAGES_FILE_PATH, 'utf-8');
      return JSON.parse(data) as Message[];
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

  private async writeMessagesToFile(): Promise<void> {
    try {
      const data = JSON.stringify(this.messages, null, 2); // Pretty-print with 2 spaces
      await fs.writeFile(MESSAGES_FILE_PATH, data, { encoding: 'utf-8' });
    } catch (error) {
      console.error(chalk.red(`Failed to write messages to file: ${error.message}`));
    }
  }

  private isMessageContentType(obj: Record<string, any>): obj is MessageContent {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.reasoning === 'string' &&
      typeof obj.conclusion === 'string' &&
      (typeof obj.command === 'string' || obj.command === undefined)
    );
  }

  private trimMessageContent(message: Message): void {
    try {
      const parsedContent = JSON.parse(message.content);

      if (this.isMessageContentType(parsedContent)) {
        parsedContent.reasoning = this.trimStringKeepHeadAndTail(parsedContent.reasoning);
        parsedContent.conclusion = this.trimStringKeepHeadAndTail(parsedContent.conclusion);
        parsedContent.command = this.trimStringKeepHeadAndTail(parsedContent.command ?? '');
        message.content = JSON.stringify(parsedContent);
      } else {
        message.content = this.trimStringKeepHeadAndTail(message.content);
      }
    } catch {
      message.content = this.trimStringKeepHeadAndTail(message.content);
    }
  }
}
