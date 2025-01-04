import { MessageContent } from '../types';

/**
 * Parses a string to extract 'reasoning', 'conclusion', and 'command' values.
 * @param {string} inputString - The input string containing the data.
 * @returns {Object} - The parsed and validated object.
 * @throws Will throw an error if parsing or validation fails.
 */
export function toMessageContent(inputString: string): MessageContent {
  const keys: Array<keyof MessageContent> = ['reasoning', 'conclusion', 'command'];

  const result: MessageContent = {
    reasoning: '',
    conclusion: '',
    command: null,
  };

  // Regular expression to match key-value pairs
  const regex = /"(\w+)":\s*(?:"((?:[^"\\]|\\.)*)"|null)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(inputString)) !== null) {
    const key = match[1] as keyof MessageContent;
    const rawValue = match[2]; // Capture the raw match here

    if (keys.includes(key)) {
      if (rawValue !== undefined) {
        result[key] = rawValue
          .replace(/\\\\/g, '\\') // Handle double backslashes
          .replace(/\\n/g, '\n') // Convert `\n` to newline
          .replace(/\\t/g, '\t') // Convert `\t` to tab
          .replace(/\\"/g, '"'); // Convert escaped quotes
      } else {
        // If the value is null
        result[key] = null;
      }
    }
  }

  return result;
}
