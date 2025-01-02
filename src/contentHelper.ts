import { MessageContent } from './types.js';

/**
 * Parses a string to extract 'reasoning', 'conclusion', and 'command' values.
 * @param {string} inputString - The input string containing the data.
 * @returns {Object} - The parsed and validated object.
 * @throws Will throw an error if parsing or validation fails.
 */
export function toMessageContent(inputString: string): MessageContent {
  // Define the keys we're interested in
  const keys = ['reasoning', 'conclusion', 'command'];

  // Initialize an empty object to hold the extracted values
  const result: Record<string, string | null> = {};

  // Regular expression to match key-value pairs
  const regex = /"(\w+)":\s*(?:"((?:[^"\\]|\\.)*)"|null)/g;

  let match;
  while ((match = regex.exec(inputString)) !== null) {
    const key = match[1];
    const rawValue = match[2]; // Capture the raw match here

    // Only process keys we're interested in
    if (keys.includes(key)) {
      if (rawValue !== undefined) {
        // Decode the raw string, preserving escaped sequences
        const value = rawValue
          .replace(/\\\\/g, '\\') // Handle double backslashes
          .replace(/\\n/g, '\n') // Convert `\n` to newline
          .replace(/\\t/g, '\t') // Convert `\t` to tab
          .replace(/\\"/g, '"'); // Convert escaped quotes
        result[key] = value;
      } else {
        // If the value is null
        result[key] = null;
      }
    }
  }

  return result as unknown as MessageContent;
}
