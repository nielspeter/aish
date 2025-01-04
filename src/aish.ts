import chalk from 'chalk';
import { runAICommands } from './commands/aiCommandRunner.js';
import { runShellCommand } from './commands/shellCommandRunner.js';
import { homedir } from 'os';
import { HistoryManager } from './managers/HistoryManager.js';
import { UserInterface } from './ui/UserInterface.js';
import { ShellManager } from './managers/ShellManager.js';
import { ModelClient } from './services/ModelClient.js';
import { MODEL_NAME, MODEL_SERVICE_API_KEY, MODEL_SERVICE_HOST } from './config.js';

async function initializeApplication() {
  console.clear();
  process.chdir(homedir());

  // Instantiate main classes
  const historyManager = new HistoryManager();
  const ui = new UserInterface(historyManager);
  const shellManager = new ShellManager();
  const modelClient = new ModelClient({
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
    modelClient,
  };
}

async function main() {
  // Step 1: Initialize everything
  const { historyManager, ui, shellManager, modelClient } = await initializeApplication();

  // Step 2: Start main loop
  while (true) {
    try {
      const userInput = await ui.askQuestion();
      if (userInput.trim().startsWith('/')) {
        // AI Command flow
        await runAICommands(userInput, historyManager, modelClient, shellManager, ui.showWorkingAnimation.bind(ui));
      } else {
        // Shell Command flow
        await runShellCommand(userInput, historyManager, shellManager);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Unexpected Error: ${errorMsg}`));
      await historyManager.addToHistory({ role: 'user', content: `Error encountered: ${errorMsg}` });
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`Unexpected Error: ${err.message}`));
  process.exit(1);
});
