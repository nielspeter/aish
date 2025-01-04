import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

import chalk from 'chalk';

import { COMMAND_END_MARKER, SHELL_PROMPT } from '../utils/config.js';

/**
 * Manages interactions with a shell process (e.g., Bash).
 *
 * This class handles spawning the shell, executing commands, capturing
 * their output, and emitting events based on the shell's responses.
 */
export class ShellManager {
  /**
   * The child process representing the shell.
   */
  private readonly shell: ChildProcess;

  /**
   * EventEmitter instance to handle command outputs and errors.
   */
  private readonly outputEmitter: EventEmitter;

  /**
   * Buffer to accumulate shell output data until the end marker is detected.
   */
  private buffer: string;

  /**
   * Creates an instance of ShellManager.
   *
   * Initializes the shell process, sets up output listeners, and writes the initial prompt.
   */
  constructor() {
    this.shell = spawn('bash', [], {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: process.env,
    });
    this.outputEmitter = new EventEmitter();
    this.buffer = '';

    this.initializeListeners();
    this.initializePrompt();
  }

  /**
   * Initializes listeners for shell output streams and process exit.
   *
   * Listens to `stdout` and `stderr` of the shell process to capture output data.
   * Emits corresponding events when the command end marker is detected.
   * Also listens for the shell process to close and handles graceful shutdown.
   */
  private initializeListeners() {
    this.shell?.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.checkForEndMarker('stdout');
    });

    this.shell?.stderr?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.checkForEndMarker('stderr');
    });

    this.shell?.on('close', (code) => {
      console.log(chalk.red(`\nShell process exited with code ${code}`));
      process.exit(code ?? 0);
    });
  }

  /**
   * Checks for the end marker in the accumulated shell output buffer.
   *
   * This method processes the buffer to detect the `COMMAND_END_MARKER`. If found,
   * it emits either a `commandOutput` or `commandError` event based on the stream type.
   * Handles backspace characters by removing the last character in the buffer.
   *
   * @param {'stdout' | 'stderr'} stream - The stream type where data was received.
   * @private
   */
  private checkForEndMarker(stream: 'stdout' | 'stderr') {
    let cleanedBuffer = '';
    for (const element of this.buffer) {
      if (element === '\b') {
        cleanedBuffer = cleanedBuffer.slice(0, -1);
      } else {
        cleanedBuffer += element;
      }
    }

    if (cleanedBuffer.includes(COMMAND_END_MARKER)) {
      const [output, ...rest] = cleanedBuffer.split(COMMAND_END_MARKER);
      const trimmedOutput = output.trim();
      if (stream === 'stdout') {
        this.outputEmitter.emit('commandOutput', trimmedOutput);
      } else {
        this.outputEmitter.emit('commandError', trimmedOutput);
      }
      this.buffer = rest.join(COMMAND_END_MARKER);
    } else {
      this.buffer = cleanedBuffer;
    }
  }

  /**
   * Initializes the shell by writing the initial prompt.
   *
   * Sends the predefined `SHELL_PROMPT` to the shell's `stdin` to prepare it for receiving commands.
   */
  private initializePrompt() {
    this.shell?.stdin?.write(SHELL_PROMPT);
  }

  /**
   * Executes a shell command and captures its output.
   *
   * Sends the command to the shell's `stdin` followed by the `COMMAND_END_MARKER` to signal the end of the command.
   * Listens for `commandOutput` and `commandError` events to capture `stdout` and `stderr` respectively.
   * Resolves with the command's output or rejects with an error if `stderr` contains data.
   *
   * @param {string} command - The shell command to execute.
   * @returns {Promise<{ stdout: string; stderr: string }>}
   * A promise that resolves with the command's `stdout` and `stderr` outputs.
   * @throws {Error} If the command execution results in an error (`stderr` is not empty).
   */
  public executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      /**
       * Handler for capturing standard output data.
       * @param {string} data - The data received from `stdout`.
       */
      const onStdout = (data: string) => {
        stdout += data + '\n';
      };

      /**
       * Handler for capturing standard error data.
       * @param {string} data - The data received from `stderr`.
       */
      const onStderr = (data: string) => {
        stderr += data + '\n';
      };

      /**
       * Handler invoked when the command execution is complete.
       *
       * Removes all listeners related to the current command and resolves or rejects the promise
       * based on whether `stderr` contains any data.
       */
      const onCommandEnd = () => {
        this.outputEmitter.removeListener('commandOutput', onStdout);
        this.outputEmitter.removeListener('commandError', onStderr);
        this.outputEmitter.removeListener('commandOutput', onCommandEnd);

        if (stderr.trim()) {
          reject(new Error(stderr.trim()));
        } else {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      };

      // Attach listeners for capturing command output and errors
      this.outputEmitter.once('commandOutput', onStdout);
      this.outputEmitter.once('commandError', onStderr);
      this.outputEmitter.once('commandOutput', onCommandEnd);

      // Write the command to the shell's stdin followed by the end marker
      this.shell?.stdin?.write(`${command}\necho ${COMMAND_END_MARKER}\n`);
    });
  }
}
