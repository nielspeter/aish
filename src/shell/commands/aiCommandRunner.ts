import chalk from 'chalk';

import { HistoryManager } from '../../history/HistoryManager.js';
import { AIChatClient } from '../../services/AIChatClient.js';
import { toMessageContent } from '../contentHelper.js';
import { ShellManager } from '../ShellManager.js';

/**
 * Handles AI-based commands in a loop.
 *
 * @param userInput The command to run
 * @param historyManager The conversation history manager
 * @param modelClient The AI model client
 * @param shellManager The shell manager
 * @param showWorkingAnimation A function that starts a spinner/animation and returns a stopper
 * @param shouldStop A callback that returns true if we must abort (e.g. user pressed Ctrl-Q)
 */
export async function runAICommands(
  userInput: string,
  historyManager: HistoryManager,
  modelClient: AIChatClient,
  shellManager: ShellManager,
  showWorkingAnimation: () => Promise<() => void>,
  shouldStop: () => boolean
) {
  // 1) Add user's command to history
  await historyManager.addToHistory({ role: 'user', content: userInput });

  // 2) Start the "working" animation
  let stopAnimation = await showWorkingAnimation();

  while (true) {
    // Check if user pressed Ctrl-* to stop
    if (shouldStop()) {
      console.log(chalk.yellow('Stopping AI commands — user interrupted.'));
      stopAnimation();
      break;
    }

    try {
      // 3) Chat with the model
      const chatResponse = await modelClient.chat(historyManager.history);
      stopAnimation(); // stop animation upon receiving response

      const rawContent = chatResponse.choices[0]?.message?.content ?? '';
      const messageContent = toMessageContent(rawContent);

      if (!messageContent) {
        console.error(chalk.red('Invalid or empty response from AI.'));
        break;
      }

      // 4) Add AI response to history
      await historyManager.addToHistory({
        role: 'assistant',
        content: JSON.stringify(messageContent),
      });

      // Show reasoning
      if (messageContent.reasoning?.trim()) {
        console.log('🤔', chalk.gray(messageContent.reasoning.trim()));
      }

      // Show conclusion
      if (messageContent.conclusion?.trim()) {
        console.log('✅', chalk.white(messageContent.conclusion.trim()));
      }

      // 5) Check if there's a "command" from the AI
      const assistantCommand = messageContent.command?.trim();
      if (!assistantCommand || assistantCommand.toLowerCase() === 'done') {
        // AI indicates no further commands or is done
        break;
      }

      // 6) Execute the command
      console.log('🛠️', chalk.white(assistantCommand));
      const { stdout, stderr } = await shellManager.executeCommand(assistantCommand);
      if (stderr) {
        // Summarize the error (optional)
        const summarizedError = await modelClient.summarizeError(stderr);
        console.error(chalk.red(`Error: ${summarizedError}`));

        await historyManager.addToHistory({
          role: 'assistant',
          content: `Error: ${summarizedError}`,
        });
      } else {
        console.log(chalk.whiteBright(stdout));
        await historyManager.addToHistory({
          role: 'assistant',
          content: `Command output: ${JSON.stringify(stdout)}`,
        });
      }

      // Restart the "working" animation for the next iteration
      stopAnimation = await showWorkingAnimation();
    } catch (error) {
      // Handle unexpected errors gracefully
      const errorMsg = error instanceof Error ? error.message : String(error);
      const summarizedError = await modelClient.summarizeError(errorMsg);
      console.error(chalk.red(`Unexpected Error: ${summarizedError}`));

      await historyManager.addToHistory({
        role: 'assistant',
        content: `Unexpected Error: ${summarizedError}`,
      });

      break; // Exit the loop on unexpected errors
    }
  }
}
