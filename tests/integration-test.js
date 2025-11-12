import ScreenshotDocumenter from '../src/main.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Integration tests for the Screenshot Documenter multi-agent system
 */

async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests for Multi-Agent System\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: System Initialization
  console.log('\nTest 1: System Initialization');
  console.log('-'.repeat(60));
  try {
    const documenter = new ScreenshotDocumenter();
    await documenter.initialize();
    console.log('✅ PASS - System initialized successfully');
    passedTests++;
  } catch (error) {
    console.error('❌ FAIL - System initialization failed:', error.message);
    failedTests++;
  }

  // Test 2: Configuration Loading
  console.log('\nTest 2: Configuration Loading');
  console.log('-'.repeat(60));
  try {
    const agentsConfig = JSON.parse(
      await fs.readFile('config/agents.json', 'utf-8')
    );
    const modelsConfig = JSON.parse(
      await fs.readFile('config/models.json', 'utf-8')
    );

    if (agentsConfig.orchestrator && modelsConfig.selection_rules) {
      console.log('✅ PASS - Configuration files loaded successfully');
      passedTests++;
    } else {
      throw new Error('Invalid configuration structure');
    }
  } catch (error) {
    console.error('❌ FAIL - Configuration loading failed:', error.message);
    failedTests++;
  }

  // Test 3: Agent Instructions Loading
  console.log('\nTest 3: Agent Instructions Loading');
  console.log('-'.repeat(60));
  try {
    const agents = ['orchestrator', 'analyst', 'content-writer', 'html-builder', 'validator'];
    let allLoaded = true;

    for (const agent of agents) {
      const instructionsPath = path.join('.claude', 'agents', `${agent}.md`);
      try {
        await fs.access(instructionsPath);
      } catch {
        console.error(`   Missing: ${agent}.md`);
        allLoaded = false;
      }
    }

    if (allLoaded) {
      console.log('✅ PASS - All agent instruction files present');
      passedTests++;
    } else {
      throw new Error('Some agent instructions missing');
    }
  } catch (error) {
    console.error('❌ FAIL - Agent instructions check failed:', error.message);
    failedTests++;
  }

  // Test 4: Template Files
  console.log('\nTest 4: Template Files');
  console.log('-'.repeat(60));
  try {
    const templates = ['html-template.hbs', 'css-template.css', 'readme-template.md'];
    let allPresent = true;

    for (const template of templates) {
      const templatePath = path.join('src', 'templates', template);
      try {
        await fs.access(templatePath);
      } catch {
        console.error(`   Missing: ${template}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log('✅ PASS - All template files present');
      passedTests++;
    } else {
      throw new Error('Some templates missing');
    }
  } catch (error) {
    console.error('❌ FAIL - Template files check failed:', error.message);
    failedTests++;
  }

  // Test 5: Utility Modules
  console.log('\nTest 5: Utility Modules');
  console.log('-'.repeat(60));
  try {
    const modules = ['image-handler.js', 'file-packager.js', 'prompt-builder.js'];
    let allPresent = true;

    for (const module of modules) {
      const modulePath = path.join('src', 'utils', module);
      try {
        await fs.access(modulePath);
      } catch {
        console.error(`   Missing: ${module}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log('✅ PASS - All utility modules present');
      passedTests++;
    } else {
      throw new Error('Some utility modules missing');
    }
  } catch (error) {
    console.error('❌ FAIL - Utility modules check failed:', error.message);
    failedTests++;
  }

  // Test 6: Agent Implementations
  console.log('\nTest 6: Agent Implementations');
  console.log('-'.repeat(60));
  try {
    const agents = [
      'base-agent.js',
      'orchestrator.js',
      'analyst-agent.js',
      'content-agent.js',
      'builder-agent.js',
      'validator-agent.js'
    ];
    let allPresent = true;

    for (const agent of agents) {
      const agentPath = path.join('src', 'agents', agent);
      try {
        await fs.access(agentPath);
      } catch {
        console.error(`   Missing: ${agent}`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log('✅ PASS - All agent implementation files present');
      passedTests++;
    } else {
      throw new Error('Some agent implementations missing');
    }
  } catch (error) {
    console.error('❌ FAIL - Agent implementations check failed:', error.message);
    failedTests++;
  }

  // Test 7: Output Directory
  console.log('\nTest 7: Output Directory');
  console.log('-'.repeat(60));
  try {
    await fs.mkdir('output', { recursive: true });
    console.log('✅ PASS - Output directory ready');
    passedTests++;
  } catch (error) {
    console.error('❌ FAIL - Output directory setup failed:', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! The multi-agent system is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Add your ANTHROPIC_API_KEY to .env file');
    console.log('2. Run: npm install');
    console.log('3. Test with a screenshot: node src/main.js <screenshot-path> --app-name "App Name"');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
