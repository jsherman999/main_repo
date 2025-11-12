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
   * Extract JSON from response text with improved error handling
   */
  extractJSON(text) {
    // Try to find JSON in the response
    // Look for JSON that starts with { and ends with }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let jsonText = jsonMatch[0];

    try {
      // First attempt: parse as-is
      return JSON.parse(jsonText);
    } catch (firstError) {
      console.warn('Initial JSON parse failed, attempting cleanup...');

      try {
        // Second attempt: try to fix common issues
        // 1. Remove trailing commas before closing brackets/braces
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

        // 2. Fix missing commas between array elements (object followed by object)
        jsonText = jsonText.replace(/\}(\s*)\{/g, '},\n{');

        // 3. Fix missing commas between array elements (closing brace, newline, opening brace)
        jsonText = jsonText.replace(/\}\s*\n\s*\{/g, '},\n{');

        // 4. Detect and fix incomplete JSON (hit token limit)
        // Count opening and closing braces/brackets
        const openBraces = (jsonText.match(/\{/g) || []).length;
        const closeBraces = (jsonText.match(/\}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;

        if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
          console.warn(`Incomplete JSON detected - adding missing closures (braces: ${openBraces}/${closeBraces}, brackets: ${openBrackets}/${closeBrackets})`);

          // Close missing brackets and braces
          for (let i = 0; i < (openBrackets - closeBrackets); i++) {
            jsonText += '\n]';
          }
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            jsonText += '\n}';
          }
        }

        return JSON.parse(jsonText);
      } catch (secondError) {
        // Third attempt: Save to file for debugging
        console.error('Failed to parse JSON after cleanup, saving to file...');

        // Save debug file asynchronously (don't await to avoid blocking)
        fs.writeFile('debug_json_error.txt', jsonText, 'utf-8').then(() => {
          console.error(`Debug JSON saved to: debug_json_error.txt`);
        }).catch(err => {
          console.error('Could not save debug file:', err.message);
        });

        // Log error details
        console.error('Error:', secondError.message);

        // Log a snippet around the error position if available
        if (secondError.message.includes('position')) {
          const posMatch = secondError.message.match(/position (\d+)/);
          if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const start = Math.max(0, pos - 200);
            const end = Math.min(jsonText.length, pos + 200);
            console.error('Context around error position:');
            console.error(jsonText.substring(start, end));
          }
        }

        throw new Error(`JSON parsing failed: ${secondError.message}. Check agent response format. Debug file saved to debug_json_error.txt`);
      }
    }
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
