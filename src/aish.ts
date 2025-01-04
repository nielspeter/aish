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
 * Set raw mode on stdin and capture keystrokes
 * so we can detect Ctrl-C, Ctrl-Q, etc.
 */
function setupRawModeKeyListener(stopFlags: { stopAI: boolean }) {
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

async function initializeApplication() {
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

async function main() {
  // Step 1: Initialize everything
  const { historyManager, ui, shellManager, modelClient } = await initializeApplication();

  // A simple object holding flags we can mutate in the key listener
  const stopFlags = { stopAI: false };

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

main().catch((err) => {
  console.error(chalk.red(`Unexpected Error: ${err.message}`));
  process.exit(1);
});
