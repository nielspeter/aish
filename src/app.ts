import chalk from 'chalk';
import { Message } from 'ollama';
import { MessageContent } from './types.js';
import { ModelClient } from './modelClient.js';
import { SYS_PROMPT, MAX_TOKENS } from './config.js';
import { ShellManager } from './shellManager.js';
import { UserInterface } from './userInterface.js';
import { trimMessagesToFitContext } from './messageTokenizer.js';

/**
 * Main function to run the interactive AI shell assistant.
 */
async function main() {
  const ui = new UserInterface();
  const shellManager = new ShellManager();
  const modelClient = new ModelClient();

  console.log(chalk.blue('Welcome to AIsh: your intelligent, interactive AI shell assistant!'));

  // Initialize messages with the system prompt
  let messages: Message[] = [
    {
      role: 'system',
      content: SYS_PROMPT,
    },
  ];

  // Prompt the user for the initial input, in a shell-style prompt
  const tokenCount = await trimMessagesToFitContext(messages, MAX_TOKENS);
  const initialInput = await ui.askQuestion(tokenCount);
  messages.push({ role: 'user', content: initialInput });

  while (true) {
    try {
      // Interact with the model
      const chatResponse = await modelClient.getResponse(messages);
      const messageContent: MessageContent = chatResponse.message.content
        ? JSON.parse(chatResponse.message.content)
        : {};

      if (messageContent.reasoning && messageContent.reasoning.trim().length > 0) {
        console.log('🤔', chalk.white(messageContent.reasoning.trim()));
      }

      if (messageContent.conclusion && messageContent.conclusion.trim().length > 0) {
        console.log('✅ ', chalk.whiteBright(messageContent.conclusion));
      }

      if (messageContent.command && messageContent.command.trim().length > 0) {
        const command = messageContent.command.trim();

        if (command.toLowerCase() !== 'done') {
          console.log('🛠️', chalk.gray(chalk.magenta(command.trim())));
        }

        messages.push({
          role: 'assistant',
          content: JSON.stringify(messageContent),
        });

        // Exit condition
        if (command.toLowerCase() === 'done' || messageContent.conclusion?.toLowerCase().includes('goal achieved')) {
          const tokenCount = await trimMessagesToFitContext(messages, MAX_TOKENS);
          const input = await ui.askQuestion(tokenCount);
          messages.push({ role: 'user', content: input });
          continue;
        }

        // Execute the command
        try {
          const { stdout, stderr } = await shellManager.executeCommand(command);

          let executionResult = '';

          if (stderr) {
            // Summarize the error
            const summarizedError = await modelClient.summarizeError(stderr);
            console.error(chalk.red(`Error: ${summarizedError}`));
            executionResult = `Error: ${summarizedError}`;
          } else {
            console.log(chalk.green(stdout));
            executionResult = `Output: ${stdout}`;
          }

          // Append command result to the conversation history
          messages.push({
            role: 'assistant',
            content: executionResult,
          });
        } catch (execError) {
          const errorMsg = execError instanceof Error ? execError.message : String(execError);
          const summarizedError = await modelClient.summarizeError(errorMsg);
          console.error(chalk.red(`Execution Error: ${summarizedError}`));
          messages.push({
            role: 'assistant',
            content: `Execution Error: ${summarizedError}`,
          });
        }
      } else {
        messages.push({
          role: 'assistant',
          content: JSON.stringify(messageContent),
        });

        const tokenCount = await trimMessagesToFitContext(messages, MAX_TOKENS);

        // Ask the user for the next task in shell-style
        const newTask = await ui.askQuestion(tokenCount);
        messages.push({ role: 'user', content: newTask });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const summarizedError = await modelClient.summarizeError(errorMsg);
      console.error(chalk.red(`Error: ${summarizedError}`));
      messages.push({
        role: 'user',
        content: `Error encountered: ${summarizedError}`,
      });
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`Unexpected Error: ${err.message}`));
  process.exit(1);
});
