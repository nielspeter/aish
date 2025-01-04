import chalk from 'chalk';
import { toMessageContent } from '../helpers/contentHelper.js';
import { HistoryManager } from '../managers/HistoryManager.js';
import { ModelClient } from '../services/ModelClient.js';
import { ShellManager } from '../managers/ShellManager.js';

export async function runAICommands(
  userInput: string,
  historyManager: HistoryManager,
  modelClient: ModelClient,
  shellManager: ShellManager,
  showWorkingAnimation: () => Promise<() => void>
) {
  // 1) Add user input to history
  await historyManager.addToHistory({ role: 'user', content: userInput });

  // 2) Start "working" animation
  const stopAnimation = await showWorkingAnimation();

  let continueExecution = true;

  while (continueExecution) {
    const chatResponse = await modelClient.chat(historyManager.messages);
    stopAnimation(); // Stop the animation once we have a response

    const messageContent = toMessageContent(chatResponse.choices[0].message.content ?? '');
    if (!messageContent?.reasoning && !messageContent?.conclusion) {
      console.error(chalk.red('Invalid response from the model.'));
      break; // bail out
    }

    // Add the AI's message to history
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
      console.log('✅ ', chalk.white(messageContent.conclusion));
    }

    // Handle "assistant command"
    const assistantCommand = messageContent.command?.trim() ?? '';
    if (!assistantCommand) {
      // no command, so we stop the loop
      continueExecution = false;
      break;
    }

    if (
      assistantCommand.toLowerCase() === 'done' ||
      messageContent.conclusion?.toLowerCase().includes('goal achieved')
    ) {
      // AI says it's done
      continueExecution = false;
      break;
    }

    // Print the command
    console.log('🛠️ ', chalk.white(assistantCommand));

    // Execute the command
    try {
      const { stdout, stderr } = await shellManager.executeCommand(assistantCommand);

      if (stderr) {
        const summarizedError = await modelClient.summarizeError(stderr);
        console.error(chalk.red(`Error: ${summarizedError}`));

        await historyManager.addToHistory({
          role: 'assistant',
          content: `Error: ${summarizedError}`,
        });
      } else {
        console.log(chalk.whiteBright(stdout), '\n');
        const executionResult = `Command output: ${JSON.stringify(stdout)}`;
        await historyManager.addToHistory({
          role: 'assistant',
          content: executionResult,
        });
      }
    } catch (execError) {
      const errorMsg = execError instanceof Error ? execError.message : String(execError);
      const summarizedError = await modelClient.summarizeError(errorMsg);
      console.error(chalk.red(`Execution Error: ${summarizedError}`));
      await historyManager.addToHistory({
        role: 'assistant',
        content: `Execution Error: ${summarizedError}`,
      });
    }
  }
}
