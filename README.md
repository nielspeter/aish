# AIsh - Interactive AI Shell Assistant

<img width="890" alt="example" src="https://github.com/user-attachments/assets/88ed9233-5e45-4f37-89a9-e6625d91945f" />

## Introduction
**AIsh** is an experimental project that explores the potential of combining the power of Large Language Models (LLMs) with the versatility of a shell environment. This is not a finished product—it's a proof of concept for developers curious about what happens when you give an AI direct access to a runtime environment.

If you've ever found yourself copying and pasting code between your editor and tools like ChatGPT or Copilot, only to debug syntax errors manually, AIsh is here to rethink that workflow. Why shouldn't the AI run the code, debug it, and iterate on it directly? AIsh takes this idea and runs with it, offering a unique blend of automation, iteration, and collaboration between users and AI.

## How It Works
AIsh creates an interactive shell environment where an LLM can:
- Execute shell commands.
- Install necessary tools.
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
Ask AIsh to perform tasks like generating project scaffolding, or fetching data from a database. It will dynamically determine the necessary tools, install them if missing, and execute the task.

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

https://github.com/user-attachments/assets/c93d55dc-de9c-45f2-851c-455445e0837e

AIsh checks out the code from GitHub and counts the number of TypeScript files in the repository

https://github.com/user-attachments/assets/26de71e2-ca18-43e1-b058-4802e33d31e2

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

## OpenAI Compatible Providers

AIsh is designed to be flexible and can integrate with any OpenAI-compatible provider. This allows you to choose the service that best fits your needs in terms of performance, cost, and available models. Here are some of the supported providers:

### Lambda Labs (recommended)
- Overview: Lambda Labs offers a cost-effective and fast alternative for deploying OpenAI-compatible models.
- **Pros**:
   - Affordable: Lower cost compared to other providers, making it suitable for budget-conscious projects.
   - Performance: Fast response times, ensuring a smooth interactive experience.
- **Cons**:
   - Limited model variety compared to some other providers.
   - May have fewer advanced features or customization options.

### OpenRouter
- Overview: OpenRouter provides access to a wide array of models, aiming to offer flexibility and comprehensive model support.
- **Pros**:
  - Diverse Models: Access to a broad selection of models, catering to various use cases.
  - Flexibility: Ability to switch between models seamlessly.
- **Cons**:
  - Stability Issues: Users have reported occasional problems, which might affect reliability.
  - Support: May have less robust support compared to established providers like OpenAI.

### ChatGPT
- Overview: Developed by OpenAI, ChatGPT is renowned for its conversational abilities and wide range of supported models.
- **Pros**:
   - High-quality, reliable responses.
   - Extensive model options with varying capabilities.
- **Cons**:
   - Can be expensive, especially for extensive usage.
   - Rate limits may apply depending on your subscription plan.

### Choosing the Right Provider
When selecting a provider for AIsh, consider the following factors:
- Cost: Evaluate your budget and choose a provider that offers the best balance between cost and performance.
- Performance: Ensure the provider can handle your workload with minimal latency.
- Model Availability: Select a provider that offers the specific models you need for your tasks.
- Reliability: Opt for providers with a track record of stability and strong support.

AIsh’s compatibility with multiple providers ensures that you can tailor your setup to your specific requirements, whether you prioritize cost, performance, or model diversity.

## Choice of Model
AIsh primarily uses the `qwen2.5-coder:32b` model for its operations. This model excels at returning structured data and is exceptionally well-suited for the interactive shell environment that AIsh provides. Its ability to generate clear, organized responses ensures reliable and accurate command execution, making it the ideal choice for this application. Extensive testing and development of AIsh have been conducted using `qwen2.5-coder:32b`, underscoring its effectiveness and compatibility with the project's objectives.

### History
The LLM remembers the history of commands and interactions. This history is stored in a hidden file in the user's home directory called `.aish_messages.json`. This allows the LLM to maintain context and provide more accurate responses based on past interactions.

## Getting Started
To try AIsh, you’ll need a machine with Docker and Ollama installed. If your machine isn’t powerful enough to run the model locally, you can opt to use the Lambda Lab API instead. The project is built with Node.js and TypeScript, making it easy to extend and modify.

### Prerequisites
- **Node.js** (version 22 or later for development)
- **Docker** and **Docker Compose**
- **Ollama** (for local LLMs) or a **Lambda Lab API account**

### Security Warning
Running AIsh outside of Docker is not recommended. When executed directly on your machine, the LLM has full access to your filesystem and can install or delete files. To mitigate this, always use the Docker Compose setup to ensure a secure and isolated environment.


## Quick Start

### Using Docker Compose (Recommended)
1. **Clone the repository:**
   ```sh
   git clone git@github.com:nielspeter/aish.git
   cd aish
    ```

1. **Run the startup script:**
   ```sh
   ./aish.sh
   ```
This builds and runs the Docker container, attaching you to an AI-driven shell environment.
   
#### Using npm (Development)
1. **Install dependencies:**
   ```sh
   npm install
   ```

1. **Run the application:**
   ```sh
   npm run start
   ```

### Configuration
The application supports two model clients: Ollama (local) and Lambda Lab API (remote). Configure the model client by setting the appropriate environment variables in the `docker-compose.yml` file or your environment.

#### Ollama (Local)
- **MODEL_SERVICE_URL**: Set to the local Ollama service url.
- **MODEL_NAME**: Set to `qwen2.5-coder:32b` for best results. You can also use `qwen2.5-coder:14b` for lower memory usage but reduced performance.

#### Lambda Lab API (Remote)
- **MODEL_SERVICE_URL**: Set to `https://api.lambdalabs.com/v1`.
- **MODEL_NAME**: Set to `qwen25-coder-32b-instruct` for best results.
- **MODEL_SERVICE_API_KEY**: Set to your Lambda Lab API key.

#### OpenAI-Compatible Providers (Remote)
To use providers like ChatGPT, Lambda Labs, or OpenRouter, configure the following environment variables accordingly:
- **MODEL_SERVICE_URL**: Set to the provider’s API endpoint.
- **MODEL_NAME**: Specify the desired model available from the provider.
- **MODEL_SERVICE_API_KEY**: Provide your API key for authentication.

### Installing Ollama
To use a local LLM with Ollama, you need to install Ollama. You can install it either from the [Ollama website](https://ollama.com/) or using Homebrew.

#### Install via Homebrew
```sh
brew install ollama
```

### License
This project is licensed under the MIT License. See the LICENSE file for details.
