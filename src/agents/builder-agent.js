import BaseAgent from './base-agent.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Builder Agent - Specializes in generating HTML and supporting files
 */
class BuilderAgent extends BaseAgent {
  async execute(context) {
    const { screenshot, analysis, content, context: userContext } = context;

    // Load the HTML template
    const template = await this.loadTemplate();

    // Convert screenshot to base64
    const screenshotBase64 = await this.imageToBase64(screenshot);

    const messages = [{
      role: 'user',
      content: `${this.instructions}

<base_template>
${template}
</base_template>

<data>
{
  "screenshot_base64": "[BASE64_DATA]",
  "screenshot_filename": "${screenshot.filename}",
  "app_name": "${userContext.appName}",
  "app_description": "${userContext.description}",
  "analysis": ${JSON.stringify(analysis, null, 2)},
  "content": ${JSON.stringify(content, null, 2)}
}
</data>

Generate the complete HTML package including all required files:
1. guide.html - Main interactive guide with hotspots and tooltips
2. README.md - Usage instructions
3. QUICKSTART.txt - Quick start guide
4. launch-guide.py - Python launcher script
5. launch-guide.bat - Windows batch launcher
6. test-image.html - Image loading test page
7. FILE-STRUCTURE.txt - File organization guide

For each file, use this delimiter format:
=== FILE: filename.ext ===
[file content here]
=== END FILE ===

Important: Make sure the HTML is valid, uses inline CSS and JavaScript (no external dependencies), and works offline.
`
    }];

    const response = await this.callClaude(messages, {
      maxTokens: this.maxTokens
    });

    const builderOutput = response.content[0].text;
    const files = this.parseMultiFileOutput(builderOutput);

    // Add the actual screenshot
    files['screenshot.png'] = screenshot.buffer;

    return files;
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

  async loadTemplate() {
    const templatePath = path.join('src', 'templates', 'html-template.hbs');
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      // If template doesn't exist, return a basic template
      return this.getDefaultTemplate();
    }
  }

  getDefaultTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{app_name}} - Interactive Guide</title>
    <style>
        /* Styles will be injected here */
    </style>
</head>
<body>
    <div class="container">
        <h1>{{app_name}}</h1>
        <div class="screenshot-container">
            <img id="screenshot" src="data:image/png;base64,{{screenshot_base64}}" alt="{{app_name}} Screenshot">
            <!-- Hotspots will be injected here -->
        </div>
        <div class="documentation">
            <!-- Documentation will be injected here -->
        </div>
    </div>
    <script>
        /* JavaScript will be injected here */
    </script>
</body>
</html>`;
  }

  parseMultiFileOutput(output) {
    const files = {};
    const fileRegex = /===\s*FILE:\s*(.+?)\s*===\s*\n([\s\S]*?)(?=\n===\s*(?:FILE:|END FILE))/g;

    let match;
    while ((match = fileRegex.exec(output)) !== null) {
      const filename = match[1].trim();
      let content = match[2].trim();

      // Remove trailing END FILE marker if present
      content = content.replace(/\n?===\s*END FILE\s*===/g, '').trim();

      files[filename] = content;
    }

    // If no files were parsed using the regex, try alternative formats
    if (Object.keys(files).length === 0) {
      // Look for code blocks with filenames
      const codeBlockRegex = /```(?:html|markdown|python|batch)?\s*\n\/\/ (.+?)\n([\s\S]*?)```/g;
      while ((match = codeBlockRegex.exec(output)) !== null) {
        const filename = match[1].trim();
        const content = match[2].trim();
        files[filename] = content;
      }
    }

    return files;
  }
}

export default BuilderAgent;
