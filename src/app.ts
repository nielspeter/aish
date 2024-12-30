import chalk from 'chalk';
import { Message } from 'ollama';
import { MessageContent } from './types.js';
import { ModelClient } from './modelClient.js';
import { SYS_PROMPT, MAX_TOKENS } from './config.js';
import { ShellManager } from './shellManager.js';
import { UserInterface } from './userInterface.js';
import { homedir } from 'os';
import { trimMessagesToFitContext } from './messageTokenizer.js';

/**
 * Main function to run the interactive AI shell assistant.
 */
async function main() {
  console.clear(); // Clear the console
  process.chdir(homedir()); // Change to the user's home directory

  const ui = new UserInterface();
  const shellManager = new ShellManager();
  const modelClient = new ModelClient();

  console.log(chalk.greenBright('Welcome to AIsh 🤖 - your intelligent, interactive AI shell assistant!\n'));
  console.log(chalk.green('Tip: Use "/" to send a command to the assistant for reasoning and assistance.'));
  console.log(chalk.green('Commands without "/" will be executed directly in the shell.'));

  // Initialize messages with the system prompt
  let messages: Message[] = [
    {
      role: 'system',
      content: SYS_PROMPT,
    },
  ];

  while (true) {
    try {
      // Ask the user for the next task in a shell-style prompt
      const tokenCount = await trimMessagesToFitContext(messages, MAX_TOKENS);
      const userInput = await ui.askQuestion(tokenCount);

      if (userInput.trim().startsWith('/')) {
        // Command prefixed with /, send to the model
        const command = userInput.trim().slice(1); // Remove the '/' prefix
        messages.push({ role: 'user', content: userInput });

        // Start the working animation
        const stopAnimation = await ui.showWorkingAnimation();

        let continueExecution = true;

        while (continueExecution) {
          const chatResponse = await modelClient.getResponse(messages);
          stopAnimation(); // Stop the animation once the response is received

          const messageContent: MessageContent = chatResponse.message.content
            ? JSON.parse(chatResponse.message.content)
            : {};

          if (messageContent.reasoning && messageContent.reasoning.trim().length > 0) {
            console.log('🤔', chalk.gray(messageContent.reasoning.trim()));
          }

          if (messageContent.conclusion && messageContent.conclusion.trim().length > 0) {
            console.log('✅ ', chalk.white(messageContent.conclusion));
          }

          if (messageContent.command && messageContent.command.trim().length > 0) {
            const assistantCommand = messageContent.command.trim();
            if (assistantCommand.toLowerCase() !== 'done') {
              console.log('🛠️ ', chalk.white(assistantCommand), '\n'); // Only for assistant command
            }

            if (
              assistantCommand.toLowerCase() === 'done' ||
              messageContent.conclusion?.toLowerCase().includes('goal achieved')
            ) {
              continueExecution = false;
              break;
            }

            // Execute the command
            try {
              const { stdout, stderr } = await shellManager.executeCommand(assistantCommand);

              let executionResult = '';

              if (stderr) {
                const summarizedError = await modelClient.summarizeError(stderr);
                console.error(chalk.red(`Error: ${summarizedError}`));
                executionResult = `Error: ${summarizedError}`;
              } else {
                console.log(chalk.white(stdout), '\n');
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
            continueExecution = false; // Stop execution if no command is provided by the assistant
          }
        }
      } else {
        // Command is not prefixed with /, bypass the model and execute directly
        const command = userInput.trim();

        try {
          const { stdout, stderr } = await shellManager.executeCommand(command);

          let executionResult = '';

          if (stderr) {
            console.error(chalk.red(stderr));
            executionResult = `Error: ${stderr}`;
          } else {
            console.log(chalk.white(stdout));
            executionResult = `Output: ${stdout}`;
          }

          // Append command and its result to the conversation history
          messages.push({ role: 'user', content: command });
          messages.push({ role: 'assistant', content: executionResult });
        } catch (execError) {
          const errorMsg = execError instanceof Error ? execError.message : String(execError);
          console.error(chalk.red(`Execution Error: ${errorMsg}`));
          messages.push({ role: 'user', content: command });
          messages.push({ role: 'assistant', content: `Execution Error: ${errorMsg}` });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Unexpected Error: ${errorMsg}`));
      messages.push({ role: 'user', content: `Error encountered: ${errorMsg}` });
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`Unexpected Error: ${err.message}`));
  process.exit(1);
});
