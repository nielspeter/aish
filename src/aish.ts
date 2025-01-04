import { homedir } from 'os';

import chalk from 'chalk';

import { HistoryManager } from './history/HistoryManager.js';
import { FileStorageStrategy } from './history/strategies/FileStorageStrategy.js';
import { SimpleTrimmingStrategy } from './history/strategies/SimpleTrimmingStrategy.js';
import { AIChatClient } from './services/AIChatClient.js';
import { runAICommands } from './shell/commands/aiCommandRunner.js';
import { runShellCommand } from './shell/commands/shellCommandRunner.js';
import { ShellManager } from './shell/ShellManager.js';
import { UserInterface } from './shell/UserInterface.js';
import { MODEL_NAME, MODEL_SERVICE_API_KEY, MODEL_SERVICE_HOST } from './utils/config.js';

/**
 * Interface representing the structure of stop flags used in key listeners.
 */
interface StopFlags {
  stopAI: boolean;
}

/**
 * Sets up a raw mode key listener on `stdin` to detect specific key presses such as Ctrl-C and Ctrl-Q.
 *
 * This function enables raw mode on the standard input, allowing the application to capture keystrokes
 * directly without waiting for the Enter key. It listens for Ctrl-C (to gracefully terminate the AI)
 * and Ctrl-Q (to gracefully terminate the entire application).
 *
 * @param {StopFlags} stopFlags - An object containing flags that can be mutated to control application behavior.
 */
function setupRawModeKeyListener(stopFlags: StopFlags): void {
  // Put stdin in raw mode
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (key) => {
    if (key.toString() === '\u0003') {
      // Ctrl-C pressed
      stopFlags.stopAI = true;
    }
    if (key.toString() === '\u0011') {
      // Ctrl-Q pressed
      stopFlags.stopAI = true;
      process.stdout.write('\n[Stopping — Ctrl-Q pressed]\n');
      process.exit(0);
    }
  });
}

/**
 * Initializes the application by setting up necessary components such as history management,
 * user interface, shell management, and AI chat client.
 *
 * This function performs the following steps:
 * 1. Clears the console and sets the current working directory to the user's home directory.
 * 2. Instantiates the main classes responsible for managing chat history, user interface, shell commands,
 *    and AI interactions.
 * 3. Initializes the history manager to load existing chat history.
 * 4. Displays a welcome message with usage tips.
 * 5. Sets up graceful shutdown handlers for signals like SIGINT and SIGTERM.
 *
 * @async
 * @returns {Promise<{
 *   historyManager: HistoryManager;
 *   ui: UserInterface;
 *   shellManager: ShellManager;
 *   modelClient: AIChatClient;
 * }>} An object containing initialized instances of HistoryManager, UserInterface, ShellManager, and AIChatClient.
 */
async function initializeApplication(): Promise<{
  historyManager: HistoryManager;
  ui: UserInterface;
  shellManager: ShellManager;
  modelClient: AIChatClient;
}> {
  console.clear();
  process.chdir(homedir());

  // Instantiate main classes
  const historyManager = new HistoryManager(new FileStorageStrategy(), new SimpleTrimmingStrategy());
  const ui = new UserInterface(historyManager);
  const shellManager = new ShellManager();
  const chatClient = new AIChatClient({
    baseURL: MODEL_SERVICE_HOST,
    apiKey: MODEL_SERVICE_API_KEY,
    model: MODEL_NAME,
  });

  // Wait for history manager to be ready
  await historyManager.init();

  // Print welcome
  console.log(chalk.greenBright('Welcome to AIsh 🤖 - your intelligent, interactive AI shell assistant!\n'));
  console.log(chalk.green('Tip: Use "/" to send a command to the assistant for reasoning and assistance.'));
  console.log(chalk.green('Commands without "/" will be executed directly in the shell.\n'));

  // Setup graceful shutdown
  const handleExit = async () => {
    console.log('\nGracefully shutting down...');
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);

  return {
    historyManager,
    ui,
    shellManager,
    modelClient: chatClient,
  };
}

/**
 * The main entry point of the application.
 *
 * This function performs the following steps:
 * 1. Initializes the application components.
 * 2. Sets up a raw mode key listener to detect and handle specific key presses.
 * 3. Enters an infinite loop to continuously accept user input.
 *    - If the input starts with "/", it processes the input as an AI command.
 *    - Otherwise, it processes the input as a shell command.
 * 4. Handles unexpected errors gracefully by logging them and updating the chat history.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when the application exits.
 */
async function main(): Promise<void> {
  // Step 1: Initialize everything
  const { historyManager, ui, shellManager, modelClient } = await initializeApplication();

  // A simple object holding flags we can mutate in the key listener
  const stopFlags: StopFlags = { stopAI: false };

  // Step 2: Setup raw mode so we can detect Ctrl-* key presses
  setupRawModeKeyListener(stopFlags);

  // Step 3: Start main loop - infinite loop to keep the shell running
  while (true) {
    try {
      const userInput = await ui.askQuestion();

      if (userInput.trim().startsWith('/')) {
        // AI Command flow
        await runAICommands(
          userInput,
          historyManager,
          modelClient,
          shellManager,
          ui.showWorkingAnimation.bind(ui),
          () => stopFlags.stopAI
        );

        // After the AI loop finishes, reset the stop flag so the next AI command works
        stopFlags.stopAI = false;
      } else {
        // Shell Command flow
        await runShellCommand(userInput, historyManager, shellManager);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Unexpected Error: ${errorMsg}`));
      await historyManager.addToHistory({
        role: 'user',
        content: `Error encountered: ${errorMsg}`,
      });
    }
  }
}

/**
 * Executes the main function and handles any unhandled promise rejections.
 *
 * If an unexpected error occurs during the execution of `main`, it logs the error message
 * and exits the process with a failure code.
 */
main().catch((err: unknown) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`Unexpected Error: ${errorMsg}`));
  process.exit(1);
});
