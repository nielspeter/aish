import { MessageContent } from '../types.js';

/**
 * Safely parses a JSON string.
 * @param jsonString - The JSON string to parse.
 * @returns A partial MessageContent object or null if parsing fails.
 */
function safeJSONParse(jsonString: string): Partial<MessageContent> | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Converts an input string to a MessageContent object.
 * Attempts to parse the string as JSON first. If that fails, uses a fallback parser.
 * @param input - The input string to convert.
 * @returns A MessageContent object.
 */
export function toMessageContent(input: string): MessageContent {
  const trimmedInput = input.trim();
  const parsedJson = safeJSONParse(trimmedInput);

  if (parsedJson) {
    const { reasoning = '', conclusion = '', command } = parsedJson;
    return {
      reasoning: String(reasoning),
      conclusion: String(conclusion),
      command: command ?? undefined,
    };
  }

  return parseMessageContentFallback(trimmedInput);
}

/**
 * Fallback parser that extracts 'reasoning', 'conclusion', and 'command' from a string.
 * @param inputString - The input string to parse.
 * @returns A MessageContent object.
 */
function parseMessageContentFallback(inputString: string): MessageContent {
  const keys: Array<keyof MessageContent> = ['reasoning', 'conclusion', 'command'];

  const result: MessageContent = {
    reasoning: '',
    conclusion: '',
    command: undefined,
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
        result[key] = '';
      }
    }
  }

  return result;
}
