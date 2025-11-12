import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';

/**
 * Base class for all specialized agents
 */
class BaseAgent {
  constructor(config) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = config.model;
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 1.0;
    this.instructions = null;
    this.tokensUsed = { input: 0, output: 0 };
  }

  /**
   * Load agent instructions from file
   */
  async loadInstructions(instructionsPath) {
    this.instructions = await fs.readFile(instructionsPath, 'utf-8');
  }

  /**
   * Execute the agent with given context
   */
  async execute(context) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Make an API call to Claude
   */
  async callClaude(messages, options = {}) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature !== undefined ? options.temperature : this.temperature,
      messages: messages
    });

    // Track token usage
    this.tokensUsed.input += response.usage.input_tokens;
    this.tokensUsed.output += response.usage.output_tokens;

    return response;
  }

  /**
   * Extract JSON from response text
   */
  extractJSON(text) {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage() {
    return {
      input: this.tokensUsed.input,
      output: this.tokensUsed.output,
      total: this.tokensUsed.input + this.tokensUsed.output
    };
  }

  /**
   * Reset token counters
   */
  resetTokenUsage() {
    this.tokensUsed = { input: 0, output: 0 };
  }
}

export default BaseAgent;
