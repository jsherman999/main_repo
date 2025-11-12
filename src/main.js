import OrchestratorAgent from './agents/orchestrator.js';
import { loadImage, validateImage } from './utils/image-handler.js';
import { createZipPackage, generateOutputFilename, createFileStructureDoc } from './utils/file-packager.js';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

class ScreenshotDocumenter {
  constructor() {
    this.orchestrator = new OrchestratorAgent({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async initialize() {
    console.log('🚀 Initializing Screenshot Documenter...');

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables. Please set it in .env file.');
    }

    await this.orchestrator.initialize();
    console.log('✅ Initialization complete');
  }

  async processScreenshot(screenshotPath, context) {
    console.log(`\n📸 Processing screenshot: ${screenshotPath}`);
    console.log(`📝 Application: ${context.appName}`);

    // Validate screenshot
    const validation = await validateImage(screenshotPath);
    if (!validation.valid) {
      throw new Error(`Invalid screenshot: ${validation.error}`);
    }

    // Load screenshot
    const screenshot = await loadImage(screenshotPath);
    console.log(`✅ Screenshot loaded: ${(screenshot.size / 1024).toFixed(2)} KB`);

    // Generate documentation
    console.log('\n🎯 Starting multi-agent documentation generation...\n');
    const result = await this.orchestrator.generateDocumentation(
      screenshot,
      context
    );

    if (!result.success) {
      console.error('❌ Generation failed:', result.error || result.validation);

      if (result.requiresManualReview) {
        console.error('⚠️ Manual review required due to validation issues');
      }

      return result;
    }

    // Add file structure documentation
    result.package['FILE-STRUCTURE.txt'] = createFileStructureDoc(result.package);

    // Package files
    console.log('\n📦 Packaging files...');
    const outputFilename = generateOutputFilename(context.appName);
    const outputPath = path.join('output', outputFilename);

    await createZipPackage(result.package, outputPath);

    console.log(`✅ Package created: ${outputPath}`);

    // Calculate cost estimate
    const costEstimate = this.calculateCost(result.metadata.tokens_used);

    console.log('\n📊 Generation Summary:');
    console.log(`   Complexity: ${result.metadata.complexity}`);
    console.log(`   Processing time: ${(result.metadata.processing_time / 1000).toFixed(2)}s`);
    console.log(`   Total tokens: ${result.metadata.tokens_used.total.toLocaleString()}`);
    console.log(`   Estimated cost: $${costEstimate.toFixed(4)}`);
    console.log(`   Validation score: ${result.validation.overall_score}/100`);

    if (result.validation.warnings && result.validation.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.validation.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    return {
      success: true,
      outputPath: outputPath,
      metadata: result.metadata,
      validation: result.validation,
      costEstimate: costEstimate
    };
  }

  calculateCost(tokens) {
    // Claude Sonnet 4 pricing: $3 per 1M input tokens, $15 per 1M output tokens
    // Claude Haiku 3.5 pricing: $1 per 1M input tokens, $5 per 1M output tokens
    // For simplicity, using average rates
    const inputCostPer1M = 2.0; // Average
    const outputCostPer1M = 10.0; // Average

    const inputCost = (tokens.input / 1000000) * inputCostPer1M;
    const outputCost = (tokens.output / 1000000) * outputCostPer1M;

    return inputCost + outputCost;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Screenshot Documenter - Multi-Agent Documentation Generator
==========================================================

Usage: node src/main.js <screenshot-path> [options]

Options:
  --app-name <name>         Application name (required)
  --description <text>      Description of the screenshot
  --vendor <name>           Vendor/product name
  --links <url1,url2>       Comma-separated helpful links
  --notes <text>            Special instructions
  --help, -h                Show this help message

Example:
  node src/main.js examples/screenshot.png \\
    --app-name "Onshape CAD" \\
    --description "3D CAD interface for robotics design" \\
    --vendor "PTC" \\
    --links "https://onshape.com,https://learn.onshape.com"

Environment Variables:
  ANTHROPIC_API_KEY         Your Anthropic API key (required)

For more information, visit: https://github.com/anthropics/claude-code
    `);
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const screenshotPath = args[0];

  // Check if screenshot file exists
  try {
    await fs.access(screenshotPath);
  } catch (error) {
    console.error(`❌ Error: Screenshot file not found: ${screenshotPath}`);
    process.exit(1);
  }

  // Parse arguments
  const context = {
    appName: getArg(args, '--app-name') || 'Application',
    description: getArg(args, '--description') || 'User interface screenshot',
    vendor: getArg(args, '--vendor'),
    links: getArg(args, '--links')?.split(',').map(link => link.trim()),
    notes: getArg(args, '--notes')
  };

  if (!getArg(args, '--app-name')) {
    console.warn('⚠️ Warning: --app-name not specified, using "Application"');
  }

  try {
    // Initialize and process
    const documenter = new ScreenshotDocumenter();
    await documenter.initialize();

    const result = await documenter.processScreenshot(screenshotPath, context);

    if (result.success) {
      console.log('\n🎉 Success!');
      console.log(`📦 Output: ${result.outputPath}`);
      console.log('\n✨ Open the guide.html file inside the ZIP to view the interactive documentation.');
    } else {
      console.error('\n❌ Failed to generate documentation');
      if (result.error) {
        console.error(`Error: ${result.error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function getArg(args, flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ScreenshotDocumenter;
