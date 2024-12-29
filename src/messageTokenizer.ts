import { encoding_for_model } from '@dqbd/tiktoken';
import { Message } from 'ollama';
import { TOKEN_MODEL, MAX_TOKENS } from './config.js';

/**
 * Trims the messages to fit within the specified token limit.
 * Ensures that the system prompt remains.
 *
 * @param {Message[]} messages - The array of messages to be trimmed.
 * @param {number} maxTokens - The maximum number of tokens allowed.
 * @returns {Promise<number>} - The total number of tokens after trimming.
 */
export async function trimMessagesToFitContext(messages: Message[], maxTokens: number): Promise<number> {
  let totalTokens = calculateTokenCount(messages, maxTokens);

  while (totalTokens > maxTokens && messages.length > 1) {
    messages.splice(1, 1);
    totalTokens = calculateTokenCount(messages, maxTokens);
  }
  return totalTokens;
}

/**
 * Calculates the total number of tokens in the given messages.
 *
 * @param {Message[]} messages - The array of messages to be tokenized.
 * @param {number} [contextLimit=MAX_TOKENS] - The maximum token limit for context.
 * @returns {number} - The total number of tokens.
 */
export function calculateTokenCount(messages: Message[], contextLimit: number = MAX_TOKENS): number {
  try {
    const encoding = encoding_for_model(TOKEN_MODEL);

    // Custom token placeholders
    const customTokens = {
      '<|im_start|>': '__IM_START__',
      '<|im_end|>': '__IM_END__',
      '<tool_call>': '__TOOL_CALL__',
      '</tool_call>': '__TOOL_CALL_END__',
    };

    // Serialize and preprocess messages
    let serializedMessages = messages.map((msg) => `<|${msg.role}|> ${msg.content}`).join('\n');

    for (const [token, placeholder] of Object.entries(customTokens)) {
      serializedMessages = serializedMessages.replace(new RegExp(token, 'g'), placeholder);
    }

    // Tokenize and count tokens
    const tokenCount = encoding.encode(serializedMessages).length;
    encoding.free();

    return tokenCount;
  } catch (error) {
    console.error('Error processing text:', error);
    return 0;
  }
}
