import chalk from 'chalk';
import readline from 'readline';
import { MAX_TOKENS } from './config.js';
import { MessageHelper } from './messageHelper';

/**
 * Class representing a user interface for interacting with the shell.
 */
export class UserInterface {
  private readonly messageHelper: MessageHelper;
  private readonly rl: readline.Interface;

  /**
   * Creates an instance of UserInterface.
   */
  constructor(messageHelper: MessageHelper) {
    this.messageHelper = messageHelper;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompts the user with a question and returns their response.
   * @returns {Promise<string>} The user's response.
   */
  public askQuestion(): Promise<string> {
    const prompt =
      chalk.cyan(`\n(t:${this.messageHelper.calculateTokenCount()}:${MAX_TOKENS}) root@aish `) + chalk.cyanBright('% ');
    return new Promise((resolve) => this.rl.question(prompt, resolve));
  }

  // Blinking Cursor Animation
  public async showWorkingAnimation() {
    const frames = ['⚙️  ', '   ']; // Frames for blinking
    let frameIndex = 0;

    const intervalId = setInterval(() => {
      process.stdout.write('\r' + frames[frameIndex]);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 500); // Adjust the blinking speed

    return () => {
      clearInterval(intervalId); // Clear the interval
      process.stdout.write('\r'); // Clear the "Working" line
    };
  }
}
