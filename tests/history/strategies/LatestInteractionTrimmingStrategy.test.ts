import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { LatestInteractionTrimmingStrategy } from '../../../src/history/strategies/LatestInteractionTrimmingStrategy.js';
import { SYS_PROMPT } from '../../../src/utils/config.js';

// Mock the @dqbd/tiktoken module
vi.mock('@dqbd/tiktoken');

describe('LatestInteractionTrimmingStrategy', () => {
  let trimmingStrategy: LatestInteractionTrimmingStrategy;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    trimmingStrategy = new LatestInteractionTrimmingStrategy();
  });

  /**
   * Helper function to create chat messages
   */
  const createMessage = (role: string, content: string): ChatCompletionMessageParam => ({
    role: role as 'system' | 'user' | 'assistant',
    content,
  });

  /**
   * Example 1: Messages Within Token Limit
   */
  it('should not trim messages when total tokens are within the limit', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Hello!'), // 2 tokens
      createMessage('assistant', 'Hi there! How can I assist you today?'), // 9 tokens
      createMessage('user', 'Can you tell me a joke?'), // 7 tokens
      createMessage('assistant', 'Why did the scarecrow win an award? Because he was outstanding in his field!'), // 15 tokens
    ];

    const maxTokens = 50; // As per Example 1

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(chatHistory);
  });

  /**
   * Example 2: Messages Exceeding Token Limit, Trimming Needed
   */
  it('should trim messages exceeding the token limit', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Hello!'), // 2 tokens
      createMessage('assistant', 'Hi there! How can I assist you today?'), // 9 tokens
      createMessage('user', 'Can you tell me a joke?'), // 7 tokens
      createMessage('assistant', 'Why did the scarecrow win an award? Because he was outstanding in his field!'), // 14 tokens
      createMessage('user', 'That was funny! Tell me another one.'), // 8 tokens
      createMessage('assistant', 'Sure! Why don’t scientists trust atoms? Because they make up everything!'), // 12 tokens
    ];

    const maxTokens = 30; // As per Example 2

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'That was funny! Tell me another one.'), // 8 tokens
      createMessage('assistant', 'Sure! Why don’t scientists trust atoms? Because they make up everything!'), // 12 tokens
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  /**
   * Example 3: Final Three Messages Exceed Max Tokens
   */
  it('should retain the final three messages even if they exceed max tokens', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Explain the theory of relativity in detail.'), // 8 tokens
      createMessage(
        'assistant',
        'The theory of relativity, developed by Albert Einstein, encompasses two interrelated theories...'
      ), // 13 tokens
    ];

    const maxTokens = 20; // As per Example 3

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Explain the theory of relativity in detail.'), // 8 tokens
      createMessage(
        'assistant',
        'The theory of relativity, developed by Albert Einstein, encompasses two interrelated theories...'
      ), // 13 tokens
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  /**
   * Example 4: No User Messages, Only System Prompt
   */
  it('should handle chat history with only the system prompt', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
    ];

    const maxTokens = 10; // As per Example 4

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'),
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  /**
   * Example 5: Multiple Trimmings with Mixed Roles
   */
  it('should handle multiple trimmings with mixed message roles', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Hi!'), // 2 tokens
      createMessage('assistant', 'Hello! How can I help you today?'), // 8 tokens
      createMessage('user', 'I need information on climate change.'), // 7 tokens
      createMessage('assistant', 'Certainly! Climate change refers to...'), // 6 tokens
      createMessage('user', 'Can you provide recent statistics?'), // 6 tokens
      createMessage('assistant', 'As of 2024, global temperatures have risen by...'), // 9 tokens
      createMessage('user', 'Thank you!'), // 3 tokens
      createMessage('assistant', 'You’re welcome! Let me know if you have any other questions.'), // 12 tokens
    ];

    const maxTokens = 25; // As per Example 5

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Thank you!'), // 3 tokens
      createMessage('assistant', 'You’re welcome! Let me know if you have any other questions.'), // 12 tokens
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  /**
   * Example 6: System Prompt Missing
   */
  it('should throw an error if the system prompt is missing', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('user', 'Hello!'),
      createMessage('assistant', 'Hi there! How can I assist you today?'),
    ];

    const maxTokens = 10; // Any value

    expect(() => trimmingStrategy.trim(chatHistory, maxTokens)).toThrow(
      'System prompt is missing in the provided messages.'
    );
  });

  /**
   * Example 7: Retains System Prompt and Latest Interaction Even If Exceeding Max Tokens
   */
  it('should re-add the system prompt if it was removed during trimming', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Hello!'), // 2 tokens
      createMessage('assistant', 'Hi there!'), // 3 tokens
    ];

    const maxTokens = 2; // Very low, forcing trimming

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'),
      createMessage('user', 'Hello!'),
      createMessage('assistant', 'Hi there!'),
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  /**
   * Additional Test: No Messages Provided
   */
  it('should initialize with the system prompt if no messages are provided', () => {
    const chatHistory: ChatCompletionMessageParam[] = [];

    const maxTokens = 10;

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [createMessage('system', SYS_PROMPT)];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  it('should retain the original last user message and truly final assistant message when token limit is exceeded', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Hello!'), // 2 tokens
      createMessage('assistant', 'Hi there! How can I assist you today?'), // 9 tokens
      createMessage('user', 'Can you help me solve a problem?'), // 8 tokens
      createMessage('assistant', 'Of course! Could you tell me more about the problem?'), // 11 tokens
      createMessage('user', 'Sure, I am trying to calculate the area of a circle.'), // 12 tokens
      createMessage('assistant', 'The formula to calculate the area of a circle is A = πr². Do you know the radius?'), // 19 tokens
      createMessage('user', 'Yes, the radius is 5.'), // 6 tokens
      createMessage('assistant', 'Substituting the radius into the formula, A = π × (5)². This simplifies to A = 25π.'), // 18 tokens
      createMessage('assistant', 'π ≈ 3.14, the area becomes A = 25 × 3.14, which equals 78.5 square units.'), // 17 tokens
    ];

    const maxTokens = 30;

    const expectedTrimmedHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'You are a helpful assistant.'), // 6 tokens
      createMessage('user', 'Yes, the radius is 5.'), // 6 tokens
      createMessage('assistant', 'π ≈ 3.14, the area becomes A = 25 × 3.14, which equals 78.5 square units.'), // 17 tokens
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);

    expect(trimmedHistory).toEqual(expectedTrimmedHistory);
  });

  it('should remove just enough oldest non-system messages to fit within the token limit', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'System prompt'), // 3 tokens
      createMessage('user', 'One'), // 2 tokens
      createMessage('assistant', 'Two'), // 2 tokens
      createMessage('user', 'Three'), // 2 tokens
      createMessage('assistant', 'Four'), // 2 tokens
      createMessage('user', 'Five'), // 2 tokens
      createMessage('assistant', 'Six'), // 2 tokens
    ];

    // That is a total of 3+2+2+2+2+2+2 = 15 tokens
    // Let's set maxTokens = 11, so we need to remove 4 tokens worth of messages
    const maxTokens = 11;

    // We'll remove the oldest non-system message(s) until it fits:
    // * Removing user "One" and assistant "Two" would reduce 4 tokens.
    // * We'll keep the rest if it fits exactly.
    const expectedTrimmed: ChatCompletionMessageParam[] = [
      createMessage('system', 'System prompt'), // 3 tokens
      createMessage('user', 'Three'), // 2 tokens
      createMessage('assistant', 'Four'), // 2 tokens
      createMessage('user', 'Five'), // 2 tokens
      createMessage('assistant', 'Six'), // 2 tokens
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);
    expect(trimmedHistory).toEqual(expectedTrimmed);
  });

  it('should retain the last user message if conversation ends with a user and no assistant follows', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'System prompt.'), // 3 tokens
      createMessage('user', 'User question 1'), // 4 tokens
      createMessage('assistant', 'Assistant answer 1'), // 4 tokens
      createMessage('user', 'User question 2 (final)'), // 5 tokens
    ];

    const maxTokens = 3; // Force trimming

    // We want the system prompt, plus the final user. There's no final assistant to keep
    const expectedTrimmed: ChatCompletionMessageParam[] = [
      createMessage('system', 'System prompt.'),
      createMessage('user', 'User question 2 (final)'),
    ];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);
    expect(trimmedHistory).toEqual(expectedTrimmed);
  });

  it('should handle multiple assistant messages without any user messages by retaining only the system prompt', () => {
    const chatHistory: ChatCompletionMessageParam[] = [
      createMessage('system', 'System prompt.'),
      createMessage('assistant', 'Assistant 1'),
      createMessage('assistant', 'Assistant 2'),
    ];

    const maxTokens = 2; // Force trimming

    // Expect only system prompt because there's no user message to anchor an assistant message
    const expectedTrimmed: ChatCompletionMessageParam[] = [createMessage('system', 'System prompt.')];

    const trimmedHistory = trimmingStrategy.trim(chatHistory, maxTokens);
    expect(trimmedHistory).toEqual(expectedTrimmed);
  });
});
