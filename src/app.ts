import chalk from 'chalk';
import { LambdaLabModelClient } from './clients/lambdaLabModelClient.js';
import { MODEL_SERVICE_API_KEY, MODEL_SERVICE_HOST } from './config.js';
import { MessageHelper } from './messageHelper.js';
import { ShellManager } from './shellManager.js';
import { UserInterface } from './userInterface.js';
import { homedir } from 'os';
import { toMessageContent } from './contentHelper.js';

/**
 * Main function to run the AIsh shell assistant.
 */
async function main() {
  console.clear(); // Clear the console
  process.chdir(homedir()); // Change to the user's home directory

  const messageHelper = new MessageHelper();
  const ui = new UserInterface(messageHelper);
  const shellManager = new ShellManager();
  const modelClient = new LambdaLabModelClient(MODEL_SERVICE_HOST, MODEL_SERVICE_API_KEY);
  await messageHelper.init();

  console.log(chalk.greenBright('Welcome to AIsh 🤖 - your intelligent, interactive AI shell assistant!\n'));
  console.log(chalk.green('Tip: Use "/" to send a command to the assistant for reasoning and assistance.'));
  console.log(chalk.green('Commands without "/" will be executed directly in the shell.'));

  // Handle graceful shutdown
  const handleExit = async () => {
    console.log('\nGracefully shutting down...');
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);

  while (true) {
    try {
      // Ask the user for the next task in a shell-style prompt
      const userInput = await ui.askQuestion();

      if (userInput.trim().startsWith('/')) {
        // Command prefixed with /, send to the model
        await messageHelper.addToHistory({ role: 'user', content: userInput });

        // Start the working animation
        const stopAnimation = await ui.showWorkingAnimation();

        let continueExecution = true;

        while (continueExecution) {
          const chatResponse = await modelClient.chat(messageHelper.messages);
          stopAnimation(); // Stop the animation once the response is received

          // Ollama Model
          // const messageContent: MessageContent = chatResponse.message.content
          //   ? JSON.parse(chatResponse.message.content)
          //   : {};

          // Lambda Lab Model
          const messageContent = toMessageContent(chatResponse.choices[0].message.content ?? '');

          if (!messageContent?.reasoning && !messageContent?.conclusion) {
            console.error(chalk.red('Invalid response from the model.'));
            continue;
          }

          await messageHelper.addToHistory({
            role: 'assistant',
            content: JSON.stringify(messageContent),
          });

          if (messageContent.reasoning && messageContent.reasoning.trim().length > 0) {
            console.log('🤔', chalk.gray(messageContent.reasoning.trim()));
          }

          if (messageContent.conclusion && messageContent.conclusion.trim().length > 0) {
            console.log('✅ ', chalk.white(messageContent.conclusion));
          }

          if (messageContent.command && messageContent.command.trim().length > 0) {
            const assistantCommand = messageContent.command.trim();
            if (assistantCommand.toLowerCase() !== 'done') {
              console.log('🛠️ ', chalk.white(assistantCommand)); // Only for assistant command
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
                console.log(chalk.whiteBright(stdout), '\n');
                executionResult = `Command output: ${JSON.stringify(stdout)}`;
              }

              // Append command result to the conversation history
              await messageHelper.addToHistory({
                role: 'assistant',
                content: executionResult,
              });
            } catch (execError) {
              const errorMsg = execError instanceof Error ? execError.message : String(execError);
              const summarizedError = await modelClient.summarizeError(errorMsg);
              console.error(chalk.red(`Execution Error: ${summarizedError}`));
              await messageHelper.addToHistory({
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
            console.log(chalk.whiteBright(stdout));
            executionResult = `Command output: ${JSON.stringify(stdout)}`;
          }

          // Append command and its result to the conversation history
          await messageHelper.addToHistory({ role: 'user', content: command });
          await messageHelper.addToHistory({ role: 'assistant', content: executionResult }); // 'terminal'
        } catch (execError) {
          const errorMsg = execError instanceof Error ? execError.message : String(execError);
          console.error(chalk.red(`Execution Error: ${errorMsg}`));
          await messageHelper.addToHistory({ role: 'user', content: command });
          await messageHelper.addToHistory({ role: 'terminal', content: `Execution Error: ${errorMsg}` });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Unexpected Error: ${errorMsg}`));
      await messageHelper.addToHistory({ role: 'user', content: `Error encountered: ${errorMsg}` });
    }
  }
}

main().catch(async (err) => {
  console.error(chalk.red(`Unexpected Error: ${err.message}`));
  process.exit(1);
});
