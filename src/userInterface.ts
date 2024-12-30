import chalk from 'chalk';
import readline from 'readline';
import { MAX_TOKENS } from './config.js';

/**
 * Class representing a user interface for interacting with the shell.
 */
export class UserInterface {
  private readonly rl: readline.Interface;

  /**
   * Creates an instance of UserInterface.
   */
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompts the user with a question and returns their response.
   * @param {number} tokenCount - The current token count.
   * @returns {Promise<string>} The user's response.
   */
  public askQuestion(tokenCount: number): Promise<string> {
    const prompt = chalk.cyan(`\n(t:${tokenCount}:${MAX_TOKENS}) user@aish `) + chalk.cyanBright('% ');
    return new Promise((resolve) => this.rl.question(prompt, resolve));
  }

  // Blinking Cursor Animation
  public async showWorkingAnimation() {
    const frames = ['.', ' ']; // Frames for blinking
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
