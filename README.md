# AIsh - Interactive AI Shell Assistant

## Description
This is an interactive AI shell assistant built with Node.js and TypeScript. It uses a model client to generate responses based on user input and executes commands in a shell environment.

## Components
- **app.ts**: Main entry point of the application. Initializes components and handles user interaction.
- **config.ts**: Configuration settings for the application, including system prompts and token limits.
- **messageHelper.ts**: Utility functions to manage message tokens within context limits.
- **modelClient.ts**: Client to interact with a language model for generating responses.
- **shellManager.ts**: Manages shell command execution.
- **types.ts**: Type definitions used throughout the application.
- **userInterface.ts**: Handles user input and output in the shell environment.
