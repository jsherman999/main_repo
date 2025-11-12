# Screenshot Documenter - Multi-Agent System

> Automatically generate interactive HTML documentation from screenshots using a multi-agent Claude Code workflow

## 🎯 Overview

This project implements a sophisticated multi-agent system that analyzes screenshots and generates comprehensive, interactive HTML documentation. It leverages multiple specialized Claude agents working together, each optimized for specific tasks.

### Key Features

- **Stylish Web UI**: Modern drag-and-drop interface for easy screenshot uploads
- **Multi-Agent Architecture**: Specialized agents for analysis, content creation, HTML generation, and validation
- **Cost-Optimized**: Hybrid approach using Sonnet for cognitive tasks and Haiku for execution (40-50% cost savings)
- **Interactive Output**: Beautiful, dark-themed HTML guides with hover tooltips
- **Comprehensive Documentation**: Workflow guides, technical specs, and keyboard shortcuts
- **History Management**: Save and access previously generated documentation packages
- **Offline Ready**: Self-contained HTML with no external dependencies

## 🌐 Web Interface

The Screenshot Documenter now includes a beautiful web interface for easy usage:

- **Drag & Drop**: Simply drag your screenshot into the browser or click to upload
- **Form Fields**: Add application name, description, vendor info, and helpful links
- **Real-time Progress**: Watch as agents process your screenshot
- **History View**: Access all previously generated documentation with original metadata
- **Download Management**: Download packages directly from the history panel

### Quick Start (Web UI)

```bash
# Install dependencies
npm install

# Start the web server
npm start

# Open browser to http://localhost:3000
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
│              (Claude Sonnet 4.5 - Coordinator)              │
│  - Receives user request                                     │
│  - Plans workflow                                            │
│  - Delegates to specialist agents                            │
│  - Synthesizes final output                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ANALYST    │    │   CONTENT    │    │   BUILDER    │
│  (Sonnet 4)  │    │  (Sonnet 4)  │    │  (Haiku 3.5) │
│              │    │              │    │              │
│ - UI element │    │ - Tooltip    │    │ - HTML gen   │
│   detection  │    │   content    │    │ - Template   │
│ - Layout     │    │ - Workflow   │    │   filling    │
│   analysis   │    │   guide      │    │ - File       │
│ - Positioning│    │ - Tech specs │    │   packaging  │
└──────────────┘    └──────────────┘    └──────────────┘
        ↓                     ↓                     ↓
        └─────────────────────┼─────────────────────┘
                              ↓
        ┌──────────────────────────────────────┐
        │         VALIDATOR AGENT               │
        │         (Haiku 3.5 - QA)             │
        │  - Check HTML validity                │
        │  - Verify tooltip positioning         │
        │  - Test responsiveness                │
        │  - Quality assurance                  │
        └──────────────────────────────────────┘
```

## 📁 Project Structure

```
screenshot-documenter/
├── .claude/                          # Claude Code configuration
│   ├── workflows/
│   └── agents/                       # Agent instruction files
│       ├── orchestrator.md
│       ├── analyst.md
│       ├── content-writer.md
│       ├── html-builder.md
│       └── validator.md
│
├── src/
│   ├── agents/                       # Agent implementations
│   │   ├── base-agent.js
│   │   ├── orchestrator.js
│   │   ├── analyst-agent.js
│   │   ├── content-agent.js
│   │   ├── builder-agent.js
│   │   └── validator-agent.js
│   │
│   ├── templates/                    # HTML/CSS templates
│   │   ├── html-template.hbs
│   │   ├── css-template.css
│   │   └── readme-template.md
│   │
│   ├── utils/                        # Utility modules
│   │   ├── image-handler.js
│   │   ├── file-packager.js
│   │   └── prompt-builder.js
│   │
│   └── main.js                       # Entry point
│
├── config/
│   ├── agents.json                   # Agent configurations
│   └── models.json                   # Model settings
│
├── public/                           # Web UI files
│   ├── index.html                    # Main web interface
│   ├── css/
│   │   └── styles.css                # Styles for web UI
│   └── js/
│       └── app.js                    # Frontend JavaScript
│
├── examples/                         # Example screenshots
├── output/                           # Generated documentation
├── data/                             # History storage
├── tests/                            # Test files
│
├── server.js                         # Web server
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/screenshot-documenter.git
cd screenshot-documenter

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Usage Options

#### Option A: Web Interface (Recommended)

```bash
# Start the web server
npm start

# Open your browser to http://localhost:3000
# Drag and drop your screenshot or click to upload
# Fill in the form and click "Generate Documentation"
```

#### Option B: Command Line Interface

```bash
# Run directly via CLI
npm run cli path/to/screenshot.png \
  --app-name "Your App Name" \
  --description "Description of the screenshot" \
  --vendor "Vendor Name" \
  --links "https://example.com"

# Or use node directly
node src/main.js path/to/screenshot.png --app-name "Your App"
```

### 3. Example (CLI)

```bash
npm run cli examples/onshape-screenshot.png \
  --app-name "Onshape CAD" \
  --description "3D CAD interface for robotics design" \
  --vendor "PTC" \
  --links "https://onshape.com,https://learn.onshape.com"
```

## 📖 Detailed Usage

### Command Line Options

```
node src/main.js <screenshot-path> [options]

Options:
  --app-name <name>         Application name (required)
  --description <text>      Description of the screenshot
  --vendor <name>           Vendor/product name
  --links <url1,url2>       Comma-separated helpful links
  --notes <text>            Special instructions
  --help, -h                Show help message
```

### Programmatic Usage

```javascript
import ScreenshotDocumenter from './src/main.js';

const documenter = new ScreenshotDocumenter();
await documenter.initialize();

const result = await documenter.processScreenshot(
  'path/to/screenshot.png',
  {
    appName: 'VS Code',
    description: 'Visual Studio Code editor interface',
    vendor: 'Microsoft',
    links: ['https://code.visualstudio.com'],
    notes: 'Focus on keyboard shortcuts'
  }
);

console.log('Generated:', result.outputPath);
```

## 🎨 Agent Roles & Responsibilities

### 1. Orchestrator Agent (Sonnet 4.5)
- Coordinates the entire workflow
- Plans task delegation
- Synthesizes results
- Handles errors

### 2. Analyst Agent (Sonnet 4)
- Analyzes UI screenshots
- Detects UI elements
- Maps spatial relationships
- Identifies functions and shortcuts

### 3. Content Writer Agent (Sonnet 4)
- Creates tooltip content
- Writes workflow guides
- Generates technical specifications
- Produces educational content

### 4. HTML Builder Agent (Haiku 3.5)
- Generates HTML/CSS/JavaScript
- Processes templates
- Creates supporting files
- Packages deliverables

### 5. Validator Agent (Haiku 3.5)
- Validates HTML syntax
- Checks content quality
- Verifies positioning
- Quality assurance

## 💰 Cost & Performance

### Performance Benchmarks

| Interface Type | Elements | Time | Cost | Model Mix |
|----------------|----------|------|------|-----------|
| Simple | <20 | 50-68s | ~$0.15 | 50% Sonnet |
| Medium | 20-50 | 83-100s | ~$0.23 | 60% Sonnet |
| Complex | >50 | 115-142s | ~$0.35 | 75% Sonnet |

### Cost Optimization

- **Hybrid Approach**: Use Sonnet for cognitive tasks, Haiku for execution
- **Savings**: 40-50% vs all-Sonnet approach
- **Trade-off**: Negligible performance difference (5% slower)

## 🧪 Testing

Run integration tests:

```bash
npm test
```

## 📊 Output

The system generates a ZIP package containing:

1. `guide.html` - Main interactive guide
2. `screenshot.png` - Original screenshot
3. `README.md` - Usage instructions
4. `QUICKSTART.txt` - Quick start guide
5. `FILE-STRUCTURE.txt` - File organization
6. `launch-guide.py` - Python launcher
7. `launch-guide.bat` - Windows launcher
8. `test-image.html` - Image loading test

## 🔧 Configuration

### Agent Configuration (`config/agents.json`)

Configure individual agents:
- Model selection
- Token limits
- Temperature settings
- Capabilities

### Model Configuration (`config/models.json`)

Define:
- Model selection rules
- Cost optimization strategy
- Performance targets
- Pricing information

## 🎯 Key Advantages

1. **Specialization**: Each agent focuses on one task
2. **Cost Optimization**: Use expensive models only where needed
3. **Parallel Processing**: Potential for concurrent execution
4. **Maintainability**: Independent agent updates
5. **Scalability**: Easy to add new agents
6. **Quality Control**: Dedicated validation agent

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Claude Code multi-agent capabilities
- Powered by Anthropic's Claude API
- Inspired by the need for better documentation tools

## 📞 Support

- Issues: [GitHub Issues](https://github.com/yourusername/screenshot-documenter/issues)
- Documentation: [Wiki](https://github.com/yourusername/screenshot-documenter/wiki)

---

**Made with ❤️ using Claude Code Multi-Agent System**
