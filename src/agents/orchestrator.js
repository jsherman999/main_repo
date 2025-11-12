import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AnalystAgent from './analyst-agent.js';
import ContentAgent from './content-agent.js';
import BuilderAgent from './builder-agent.js';
import ValidatorAgent from './validator-agent.js';

class OrchestratorAgent {
  constructor(config) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.config = config;
    this.apiKey = config.apiKey;
    this.agents = {};
    this.totalTokens = { input: 0, output: 0 };
  }

  async initialize() {
    console.log('🎯 Initializing Orchestrator and agents...');

    // Initialize specialist agents
    this.agents.analyst = new AnalystAgent({
      apiKey: this.apiKey,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8000,
      temperature: 0.8
    });

    this.agents.content = new ContentAgent({
      apiKey: this.apiKey,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 12000,
      temperature: 0.9
    });

    this.agents.builder = new BuilderAgent({
      apiKey: this.apiKey,
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 16000,
      temperature: 0.7
    });

    this.agents.validator = new ValidatorAgent({
      apiKey: this.apiKey,
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 4000,
      temperature: 0.3
    });

    // Load instructions for all agents
    await Promise.all([
      this.agents.analyst.loadInstructions(path.join('.claude', 'agents', 'analyst.md')),
      this.agents.content.loadInstructions(path.join('.claude', 'agents', 'content-writer.md')),
      this.agents.builder.loadInstructions(path.join('.claude', 'agents', 'html-builder.md')),
      this.agents.validator.loadInstructions(path.join('.claude', 'agents', 'validator.md'))
    ]);

    console.log('✅ All agents initialized');
  }

  async generateDocumentation(screenshot, context, debugCallback = null) {
    console.log('🎯 Orchestrator: Starting documentation generation...');
    const startTime = Date.now();

    // Step 1: Plan the workflow
    if (debugCallback) {
      debugCallback('info', 'Orchestrator', 'Planning workflow', { complexity: 'analyzing' });
    }

    const plan = await this.planWorkflow(screenshot, context);
    console.log('📋 Workflow plan created:', plan.complexity, 'interface');

    if (debugCallback) {
      debugCallback('info', 'Orchestrator', 'Workflow plan created', {
        complexity: plan.complexity,
        estimatedElements: plan.estimated_elements,
        estimatedTime: `${plan.estimated_time}s`
      });
    }

    try {
      // Step 2: UI Analysis (Sonnet)
      console.log('🔍 Running UI Analysis...');
      if (debugCallback) {
        debugCallback('start', 'Analyst Agent', 'Starting UI analysis with Claude Sonnet 4', {
          model: 'claude-sonnet-4-20250514'
        });
      }

      const analysis = await this.agents.analyst.execute({
        screenshot,
        context
      });
      console.log(`✅ Analysis complete: ${analysis.metadata.total_elements} elements found`);

      if (debugCallback) {
        debugCallback('complete', 'Analyst Agent', 'UI analysis complete', {
          elementsFound: analysis.metadata.total_elements,
          tokensUsed: this.agents.analyst.getTokenUsage().total
        });
      }

      // Step 3: Content Generation (Sonnet)
      console.log('✍️ Running Content Generation...');
      if (debugCallback) {
        debugCallback('start', 'Content Agent', 'Generating documentation content with Claude Sonnet 4', {
          model: 'claude-sonnet-4-20250514'
        });
      }

      const content = await this.agents.content.execute({
        analysis,
        context
      });
      console.log(`✅ Content generated: ${content.tooltips.length} tooltips`);

      if (debugCallback) {
        debugCallback('complete', 'Content Agent', 'Content generation complete', {
          tooltipsGenerated: content.tooltips.length,
          tokensUsed: this.agents.content.getTokenUsage().total
        });
      }

      // Step 4: HTML Building (Haiku)
      console.log('🏗️ Running HTML Builder...');
      if (debugCallback) {
        debugCallback('start', 'Builder Agent', 'Building interactive HTML with Claude Haiku 3.5', {
          model: 'claude-3-5-haiku-20241022'
        });
      }

      const htmlPackage = await this.agents.builder.execute({
        screenshot,
        analysis,
        content,
        context
      });
      console.log('✅ HTML package built');

      if (debugCallback) {
        debugCallback('complete', 'Builder Agent', 'HTML package built successfully', {
          filesGenerated: Object.keys(htmlPackage).length,
          tokensUsed: this.agents.builder.getTokenUsage().total
        });
      }

      // Step 5: Validation (Haiku)
      console.log('✅ Running Validator...');
      if (debugCallback) {
        debugCallback('start', 'Validator Agent', 'Validating output quality with Claude Haiku 3.5', {
          model: 'claude-3-5-haiku-20241022'
        });
      }

      const validation = await this.agents.validator.execute({
        htmlPackage
      });
      console.log(`✅ Validation complete: ${validation.overall_score}/100`);

      if (debugCallback) {
        debugCallback('complete', 'Validator Agent', 'Validation complete', {
          overallScore: `${validation.overall_score}/100`,
          validationPassed: validation.validation_passed,
          tokensUsed: this.agents.validator.getTokenUsage().total
        });
      }

      // Check validation results
      if (!validation.validation_passed) {
        console.log('⚠️ Validation issues found');
        if (debugCallback) {
          debugCallback('info', 'Orchestrator', 'Validation warnings found', {
            warnings: validation.warnings?.length || 0
          });
        }
        if (validation.critical_issues && validation.critical_issues.length > 0) {
          console.log('❌ Critical issues:', validation.critical_issues);
          if (debugCallback) {
            debugCallback('error', 'Orchestrator', 'Critical validation issues found', {
              criticalIssues: validation.critical_issues.length
            });
          }
          return await this.handleValidationFailure(
            htmlPackage,
            validation,
            screenshot,
            analysis,
            content,
            context
          );
        }
      }

      // Calculate total tokens
      this.calculateTotalTokens();

      const processingTime = Date.now() - startTime;

      if (debugCallback) {
        debugCallback('complete', 'Orchestrator', 'All agents completed successfully', {
          processingTime: `${(processingTime / 1000).toFixed(1)}s`,
          totalTokens: this.totalTokens.total.toLocaleString(),
          complexity: plan.complexity
        });
      }

      return {
        success: true,
        package: htmlPackage,
        validation: validation,
        metadata: {
          workflow_id: plan.workflow_id,
          processing_time: processingTime,
          tokens_used: this.totalTokens,
          complexity: plan.complexity
        }
      };

    } catch (error) {
      console.error('❌ Error during documentation generation:', error);
      if (debugCallback) {
        debugCallback('error', 'Orchestrator', 'Documentation generation failed', {
          error: error.message
        });
      }
      return {
        success: false,
        error: error.message,
        metadata: {
          workflow_id: plan.workflow_id,
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  async planWorkflow(screenshot, context) {
    const planningPrompt = `
Analyze this screenshot documentation request and create an execution plan.

Screenshot size: ${screenshot.size} bytes
User context: ${JSON.stringify(context, null, 2)}

Determine:
1. Complexity level (simple/medium/complex) based on:
   - simple: <20 elements, basic interface
   - medium: 20-50 elements, moderate complexity
   - complex: >50 elements, professional application
2. Estimated element count
3. Required workflow steps
4. Model selection for each step
5. Estimated processing time and cost

Provide a structured JSON workflow plan with this format:
{
  "workflow_id": "uuid",
  "complexity": "simple|medium|complex",
  "estimated_elements": number,
  "estimated_time": seconds,
  "estimated_cost": dollars
}
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: planningPrompt
        }]
      });

      const responseText = response.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      plan.workflow_id = plan.workflow_id || uuidv4();
      plan.complexity = plan.complexity || 'medium';
      plan.start_time = Date.now();

      return plan;
    } catch (error) {
      console.warn('⚠️ Planning failed, using default plan:', error.message);
      return {
        workflow_id: uuidv4(),
        complexity: 'medium',
        estimated_elements: 30,
        estimated_time: 90,
        estimated_cost: 0.23,
        start_time: Date.now()
      };
    }
  }

  async handleValidationFailure(htmlPackage, validation, screenshot, analysis, content, context) {
    console.log('🔄 Handling validation failure...');

    const criticalIssues = validation.critical_issues || [];

    if (criticalIssues.length === 0) {
      // Only warnings, proceed anyway
      console.log('⚠️ Only warnings found, proceeding...');
      return {
        success: true,
        package: htmlPackage,
        validation: validation,
        warnings: validation.warnings
      };
    }

    // Log critical issues
    console.log('❌ Critical issues found:');
    criticalIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });

    // For now, return with requiresManualReview flag
    // In production, could implement retry logic
    return {
      success: false,
      package: htmlPackage,
      validation: validation,
      requiresManualReview: true,
      criticalIssues: criticalIssues
    };
  }

  calculateTotalTokens() {
    this.totalTokens = {
      input: 0,
      output: 0
    };

    for (const [name, agent] of Object.entries(this.agents)) {
      const usage = agent.getTokenUsage();
      this.totalTokens.input += usage.input;
      this.totalTokens.output += usage.output;
    }

    this.totalTokens.total = this.totalTokens.input + this.totalTokens.output;
  }

  getTotalTokens() {
    return this.totalTokens;
  }
}

export default OrchestratorAgent;
