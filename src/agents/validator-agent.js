import BaseAgent from './base-agent.js';

/**
 * Validator Agent - Specializes in quality assurance and validation
 */
class ValidatorAgent extends BaseAgent {
  async execute(context) {
    const { htmlPackage } = context;

    // Prepare file information for validation
    const filesToValidate = Object.entries(htmlPackage)
      .map(([name, content]) => ({
        name,
        content: typeof content === 'string' ? content.substring(0, 5000) : '[binary]',
        size: typeof content === 'string' ? content.length : content.length,
        type: this.getFileType(name)
      }));

    const messages = [{
      role: 'user',
      content: `${this.instructions}

<files_to_validate>
${JSON.stringify(filesToValidate, null, 2)}
</files_to_validate>

<package_contents>
Files in package: ${Object.keys(htmlPackage).join(', ')}
Total files: ${Object.keys(htmlPackage).length}
</package_contents>

Validate this HTML documentation package and provide a detailed validation report.

Check:
1. HTML validity (if HTML files present)
2. Content quality (no placeholders, proper length)
3. File completeness (all required files present)
4. Technical correctness

Output as structured JSON matching the validation format in your instructions.
`
    }];

    const response = await this.callClaude(messages);

    // Extract and parse JSON from response
    const validationText = response.content[0].text;
    const validation = this.extractJSON(validationText);

    return validation;
  }

  getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
      'html': 'HTML',
      'md': 'Markdown',
      'txt': 'Text',
      'py': 'Python',
      'bat': 'Batch',
      'png': 'Image',
      'jpg': 'Image',
      'jpeg': 'Image'
    };
    return typeMap[ext] || 'Unknown';
  }
}

export default ValidatorAgent;
