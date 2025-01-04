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
      createMessage('user', 'Hello!'), // 2 token
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
      createMessage('user', 'Hi!'), // 2 token
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
      createMessage('user', 'Hello!'), // 2 token
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
});
