import BaseAgent from './base-agent.js';
import { promises as fs } from 'fs';

/**
 * Analyst Agent - Specializes in UI analysis from screenshots
 */
class AnalystAgent extends BaseAgent {
  async execute(context) {
    const { screenshot, context: userContext } = context;

    // Convert screenshot to base64
    const screenshotBase64 = await this.imageToBase64(screenshot);

    const messages = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: screenshot.mimetype,
            data: screenshotBase64
          }
        },
        {
          type: 'text',
          text: `${this.instructions}

<screenshot_context>
Application: ${userContext.appName}
Description: ${userContext.description}
Vendor: ${userContext.vendor || 'Unknown'}
Links: ${userContext.links?.join(', ') || 'None'}
Special Instructions: ${userContext.notes || 'None'}
</screenshot_context>

Analyze this screenshot and provide a complete JSON structure of all UI elements following the output format specified in your instructions.`
        }
      ]
    }];

    const response = await this.callClaude(messages);

    // Extract and parse JSON from response
    const analysisText = response.content[0].text;
    const analysis = this.extractJSON(analysisText);

    return analysis;
  }

  async imageToBase64(screenshot) {
    if (screenshot.base64) {
      return screenshot.base64;
    }
    if (screenshot.buffer) {
      return screenshot.buffer.toString('base64');
    }
    if (screenshot.path) {
      const buffer = await fs.readFile(screenshot.path);
      return buffer.toString('base64');
    }
    throw new Error('Invalid screenshot format');
  }
}

export default AnalystAgent;
