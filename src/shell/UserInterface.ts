import readline from 'readline';

import chalk from 'chalk';

import { HistoryManager } from '../history/HistoryManager.js';
import { HISTORY_MAX_TOKENS } from '../utils/config.js';

/**
 * Class representing a user interface for interacting with the shell.
 */
export class UserInterface {
  private readonly messageHelper: HistoryManager;
  private readonly rl: readline.Interface;

  constructor(messageHelper: HistoryManager) {
    this.messageHelper = messageHelper;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // -- Override the default Ctrl-C behavior so that readline doesn't close --
    this.rl.on('SIGINT', () => {
      process.stdout.write(chalk.yellow('\n(^C) Ctrl-C was pressed.\n'));
      this.rl.prompt();
    });
  }

  /**
   * Prompts the user with a question and returns their response.
   * @returns {Promise<string>} The user's response.
   */
  public askQuestion(): Promise<string> {
    const prompt =
      chalk.cyan(`(t:${this.messageHelper.calculateTokenCount()}:${HISTORY_MAX_TOKENS}) root@aish `) +
      chalk.cyanBright('% ');

    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Blinking "working" animation (⚙️ ... ).
   * Returns a stop function to end the animation.
   */
  public async showWorkingAnimation() {
    const frames = ['⚙️ ', '   ']; // Frames for blinking animation
    let frameIndex = 0;

    const intervalId = setInterval(() => {
      process.stdout.write('\r' + frames[frameIndex]);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 500);

    return () => {
      clearInterval(intervalId);
      process.stdout.write('\r'); // Clear the "Working" line
    };
  }
}
