/**
 * Utility functions for building prompts for different agents
 */

/**
 * Build context string for agents
 */
export function buildContextString(context) {
  return `
Application: ${context.appName}
Description: ${context.description}
${context.vendor ? `Vendor: ${context.vendor}` : ''}
${context.links ? `Links: ${context.links.join(', ')}` : ''}
${context.notes ? `Special Instructions: ${context.notes}` : ''}
`.trim();
}

/**
 * Build analysis prompt
 */
export function buildAnalysisPrompt(instructions, context) {
  const contextString = buildContextString(context);

  return `${instructions}

<screenshot_context>
${contextString}
</screenshot_context>

Analyze this screenshot and provide a complete JSON structure of all UI elements following the output format specified in your instructions.`;
}

/**
 * Build content generation prompt
 */
export function buildContentPrompt(instructions, analysis, context) {
  const contextString = buildContextString(context);

  return `${instructions}

<ui_analysis>
${JSON.stringify(analysis, null, 2)}
</ui_analysis>

<context>
${contextString}
</context>

Generate comprehensive tooltip content, workflow documentation, and technical specifications based on the UI analysis.

Output as structured JSON following the format specified in your instructions.`;
}

/**
 * Build HTML generation prompt
 */
export function buildHtmlPrompt(instructions, template, data) {
  return `${instructions}

<base_template>
${template}
</base_template>

<data>
${JSON.stringify(data, null, 2)}
</data>

Generate the complete HTML package including all required files. Use the delimiter format specified in your instructions.`;
}

/**
 * Build validation prompt
 */
export function buildValidationPrompt(instructions, packageInfo) {
  return `${instructions}

<files_to_validate>
${JSON.stringify(packageInfo.files, null, 2)}
</files_to_validate>

<package_contents>
Files in package: ${packageInfo.fileNames.join(', ')}
Total files: ${packageInfo.totalFiles}
</package_contents>

Validate this HTML documentation package and provide a detailed validation report.
Output as structured JSON matching the validation format in your instructions.`;
}

/**
 * Truncate long strings for prompts
 */
export function truncateString(str, maxLength = 1000) {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + '...[truncated]';
}

/**
 * Format JSON for prompts
 */
export function formatJsonForPrompt(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

/**
 * Extract code blocks from response
 */
export function extractCodeBlocks(text) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];

  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return blocks;
}

/**
 * Extract JSON from text
 */
export function extractJson(text) {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}
