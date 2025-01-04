import chalk from 'chalk';
import { COMMAND_END_MARKER, SHELL_PROMPT } from './config.js';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

export class ShellManager {
  private readonly shell: ChildProcess;
  private readonly outputEmitter: EventEmitter;
  private buffer: string;

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
   * Initializes listeners for shell output and errors.
   * @private
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
      process.exit(code || 0);
    });
  }

  /**
   * Checks for the end marker in the shell output buffer.
   * @param {('stdout' | 'stderr')} stream - The stream to check for the end marker.
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
   * Initializes the shell prompt.
   * @private
   */
  private initializePrompt() {
    this.shell?.stdin?.write(SHELL_PROMPT);
  }

  /**
   * Executes a shell command.
   * @param {string} command - The command to execute.
   * @returns {Promise<{ stdout: string; stderr: string }>} The command's output and error.
   */
  public executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const onStdout = (data: string) => {
        stdout += data + '\n';
      };

      const onStderr = (data: string) => {
        stderr += data + '\n';
      };

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

      this.outputEmitter.once('commandOutput', onStdout);
      this.outputEmitter.once('commandError', onStderr);
      this.outputEmitter.once('commandOutput', onCommandEnd);

      this.shell?.stdin?.write(`${command}\necho ${COMMAND_END_MARKER}\n`);
    });
  }
}
