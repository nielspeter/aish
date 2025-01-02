# AIsh - Interactive AI Shell Assistant

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

Using the power of containerization via Docker, AIsh ensures a safe sandboxed environment where the AI can operate without compromising your system.

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

Request a Rust project to fetch stock prices, and AIsh will:
1.	Check if Rust is installed (installing it if necessary).
2.	Create the project files.
3.	Write and execute the code.
4.	Iterate until the task is complete.

### Real-Time Collaboration
Work alongside the AI, guiding it to refine results or execute specific tasks. The AI maintains a history of actions, providing context for iterative improvements.

### A Developer’s Experiment
AIsh is an experiment born from curiosity and a vision for the future. It’s a playful step toward a world where developers have tireless, adaptive assistants to tackle the tedious parts of coding while leaving the creative and strategic work to us.

So, if you’re ready to explore and experiment, clone the repo, fire up Docker, and see where this journey takes you.

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
- **Node.js** (version 22 or later)
- **Docker** and **Docker Compose**
- **Ollama** (for local LLMs) or a **Lambda Lab API account**

### Security Warning
Running AIsh outside of Docker is not recommended. When executed directly on your machine, the LLM has full access to your filesystem and can install or delete files. To mitigate this, always use the Docker Compose setup to ensure a secure and isolated environment.

---

### Features
1. **LLM-Driven Shell Automation**: Allows the AI to interact with your shell environment, executing commands iteratively to complete tasks.
2. **Containerized Safety**: Uses Docker to ensure commands run in a sandboxed environment.
3. **Configurable AI Models**: Supports both local (Ollama) and remote (Lambda Lab API) LLMs.
4. **Dynamic Task Execution**: The AI installs dependencies, retrieves data, and runs code autonomously.
5. **Collaborative Workflows**: You can interject and collaborate with the AI at any point during the process.

---

## Quick Start

### Using Docker Compose (Recommended)
1. Clone the repository:
   ```sh
   git clone git@github.com:nielspeter/aish.git
   cd aish
    ```

1. **Install dependencies:**
   ```sh
   npm install
   ```

1. Run the startup script:
   ```sh
   ./aish.sh
   ```
This builds and runs the Docker container, attaching you to an AI-driven shell environment.
   
#### Using npm (Development)
2. **Run the application:**
   ```sh
   npm run start
   ```

#### Using Docker Compose (Recommended for Security)
1. **Build and start the container:**
   ```sh
   ./aish.sh
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

### Example `docker-compose.yml` Configuration
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    stdin_open: true
    tty: true
    environment:
      - HOME=/mnt/root
      - MODEL_SERVICE_HOST=https://api.lambdalabs.com/v1/chat/completions
      - MODEL_NAME=qwen25-coder-32b-instruct
      - MODEL_SERVICE_API_KEY=<API_KEY>
    user: root
    volumes:
      - "${PWD}/root:/mnt/root"
```

### Example `Dockerfile`
```dockerfile
# Use an official Node runtime as a parent image
FROM node:current

# Set the working directory inside the container to /opt/aish
WORKDIR /opt/aish

# Install any needed packages specified in package.json
COPY package*.json ./
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Run your application
CMD ["npm", "start"]
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.