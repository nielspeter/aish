# AIsh - Interactive AI Shell Assistant

<img width="890" alt="example" src="https://github.com/user-attachments/assets/88ed9233-5e45-4f37-89a9-e6625d91945f" />

## Introduction
**AIsh** is an experimental project that explores the potential of combining the power of Large Language Models (LLMs) with the versatility of a shell environment. This is not a finished product—it's a proof of concept for developers curious about what happens when you give an AI direct access to a runtime environment.

If you've ever found yourself copying and pasting code between your editor and tools like ChatGPT or Copilot, only to debug syntax errors manually, AIsh is here to rethink that workflow. Why shouldn't the AI run the code, debug it, and iterate on it directly? AIsh takes this idea and runs with it, offering a unique blend of automation, iteration, and collaboration between developers and AI.

## How It Works
AIsh creates an interactive shell environment where an LLM can:
- Execute shell commands.
- Install necessary tools.
- Run and test code autonomously.
- Retrieve and interact with real-time data from APIs and the internet.
- Collaborate with the user, blending AI-driven automation with human guidance.

## The Vision
AIsh demonstrates a glimpse into the future of development: a world where developers have personal AI programming assistants that:
- Understand and execute tasks iteratively.
- Leverage system tools to enhance accuracy and efficiency.
- Take on repetitive tasks, running syntax checks, or even testing and deploying code.

The result is a seamless workflow where you and the AI work together, each playing to your strengths.

## Example Scenarios

### Simple Automation
Ask AIsh to perform tasks like counting words in a file, generating project scaffolding, or fetching the weather. It will dynamically determine the necessary tools, install them if missing, and execute the task.

### Coding Assistance

Request a Java project to fetch stock prices, and AIsh will:
1.	Check if Java is installed (installing it if necessary).
2.	Create the project files.
3.	Write and execute the code.
4.	Iterate until the task is complete.

### Real-Time Collaboration
Work alongside the AI, guiding it to refine results or execute specific tasks. The AI maintains a history of actions, providing context for iterative improvements.

### Examples of AIsh in Action

AIsh creates a Python script to calculate an arithmetic sequence and executes it. Create the same script in TypeScript, install Deno, and run it.

https://github.com/user-attachments/assets/3e976ff8-ebcd-48d4-a7ca-0d7d4fb4e6ff

AIsh checks out the code from GitHub and counts the number of TypeScript files in the repository

https://github.com/user-attachments/assets/4787fad2-d199-4f71-9320-ab1ef6385a4c

AIsh connects to a remote database and lists all orders that have been shipped.

https://github.com/user-attachments/assets/6615d25e-1190-4d20-a4c3-049af0678306


### A Developer’s Experiment
AIsh is an experiment born from curiosity and a vision for the future. It’s a playful step toward a world where developers have tireless, adaptive assistants to tackle the tedious parts of coding while leaving the creative and strategic work to us.

So, if you’re ready to explore and experiment, clone the repo, fire up Docker, and see where this journey takes you.

## The Importance of a Well-Defined System Prompt
The system prompt is fundamental to shaping the behavior of the LLM, ensuring its outputs align with expectations. Serving as the AI's "operating manual," it directs the model to respond in a structured and predictable manner. Even slight changes to the prompt can have significant consequences, causing the model to behave differently. Therefore, crafting the right prompt is a delicate task.

AIsh operates within a strict JSON schema, enabling clear reasoning, concise conclusions, and precise command execution. This structure is essential for seamlessly integrating AI-driven automation into a shell environment. Since not all LLMs inherently adhere to such structured outputs, the system prompt enforces this consistency, ensuring reliability and accuracy.

Developers are encouraged to experiment with the system prompt to achieve the best results for their specific use cases. Iterating on the prompt, testing different phrasing, and refining its structure can help tailor the model's behavior to better align with the desired outcomes.

## Shell Interface

The shell interface in AIsh allows you to execute shell commands as you normally would. However, if you start a command with a `/`, the command or task is sent to the LLM (Large Language Model) for processing.

### Command Execution
- **Standard Shell Commands**: Execute commands directly in the shell.
- **LLM Commands**: Prefix commands with `/` to send them to the LLM.

### History
The LLM remembers the history of commands and interactions. This history is stored in a hidden file in the user's home directory called `.aish_messages.json`. This allows the LLM to maintain context and provide more accurate responses based on past interactions.

## Getting Started
To try AIsh, all you need is a Unix-based machine with Docker and Ollama installed. The project uses Node.js and TypeScript, making it straightforward to extend or modify.

### Prerequisites
- **Node.js** (version 22 or later for development)
- **Docker** and **Docker Compose**
- **Ollama** (for local LLMs) or a **Lambda Lab API account**

### Security Warning
Running AIsh outside of Docker is not recommended. When executed directly on your machine, the LLM has full access to your filesystem and can install or delete files. To mitigate this, always use the Docker Compose setup to ensure a secure and isolated environment.


## Quick Start

### Using Docker Compose (Recommended)
1. Clone the repository:
   ```sh
   git clone git@github.com:nielspeter/aish.git
   cd aish
    ```

1. Run the startup script:
   ```sh
   ./aish.sh
   ```
This builds and runs the Docker container, attaching you to an AI-driven shell environment.
   
#### Using npm (Development)
1. **Run the application:**
   ```sh
   npm run start
   ```

### Configuration
The application supports two model clients: Ollama (local) and Lambda Lab API (remote). Configure the model client by setting the appropriate environment variables in the `docker-compose.yml` file or your environment.

#### Ollama (Local)
- **MODEL_SERVICE_HOST**: Set to the local Ollama service host.
- **MODEL_NAME**: Set to `qwen2.5-coder:32b` for best results. You can also use `qwen2.5-coder:14b` for lower memory usage but reduced performance.

#### Lambda Lab API (Remote)
- **MODEL_SERVICE_HOST**: Set to `https://api.lambdalabs.com/v1/chat/completions`.
- **MODEL_NAME**: Set to `qwen25-coder-32b-instruct` for best results or `lfm-40b`.
- **MODEL_SERVICE_API_KEY**: Set to your Lambda Lab API key.

### Installing Ollama
To use a local LLM with Ollama, you need to install Ollama. You can install it either from the [Ollama website](https://ollama.com/) or using Homebrew.

#### Install via Homebrew
```sh
brew install ollama
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.
