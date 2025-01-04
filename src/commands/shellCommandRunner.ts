import chalk from 'chalk';
import { HistoryManager } from '../managers/HistoryManager.js';
import { ShellManager } from '../managers/ShellManager.js';

export async function runShellCommand(userInput: string, historyManager: HistoryManager, shellManager: ShellManager) {
  const command = userInput.trim();

  try {
    // Append user command to conversation history
    await historyManager.addToHistory({ role: 'user', content: command });

    const { stdout, stderr } = await shellManager.executeCommand(command);
    if (stderr) {
      console.error(chalk.red(stderr));
      await historyManager.addToHistory({ role: 'assistant', content: `Error: ${stderr}` });
    } else {
      console.log(chalk.whiteBright(stdout));
      await historyManager.addToHistory({ role: 'assistant', content: `Command output: ${JSON.stringify(stdout)}` });
    }
  } catch (execError) {
    const errorMsg = execError instanceof Error ? execError.message : String(execError);
    console.error(chalk.red(`Execution Error: ${errorMsg}`));

    await historyManager.addToHistory({ role: 'user', content: command });
    await historyManager.addToHistory({ role: 'assistant', content: `Execution Error: ${errorMsg}` });
  }
}
