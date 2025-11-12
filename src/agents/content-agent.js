import BaseAgent from './base-agent.js';

/**
 * Content Agent - Specializes in creating tooltip content and documentation
 */
class ContentAgent extends BaseAgent {
  async execute(context) {
    const { analysis, context: userContext } = context;

    const messages = [{
      role: 'user',
      content: `${this.instructions}

<ui_analysis>
${JSON.stringify(analysis, null, 2)}
</ui_analysis>

<context>
Application: ${userContext.appName}
Description: ${userContext.description}
Vendor: ${userContext.vendor || 'Unknown'}
Links: ${userContext.links?.join(', ') || 'None'}
Special Instructions: ${userContext.notes || 'None'}
</context>

Generate comprehensive tooltip content, workflow documentation, and technical specifications based on the UI analysis.

Output as structured JSON following the format specified in your instructions. Include:
1. Tooltip content for each element
2. Workflow documentation
3. Technical specifications (if applicable)
4. Quick reference guide with shortcuts
`
    }];

    const response = await this.callClaude(messages);

    // Extract and parse JSON from response
    const contentText = response.content[0].text;
    const content = this.extractJSON(contentText);

    return content;
  }
}

export default ContentAgent;
