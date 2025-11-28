# iOS Development, Testing & Deployment Workflow Guide
## Complete Guide for Mac mini M4

This guide walks you through the entire iOS development process from setup to App Store deployment, specifically for someone new to iOS development using a Mac mini M4.

---

## Table of Contents

1. [Initial Setup & Requirements](#initial-setup--requirements)
2. [Development Tools](#development-tools)
3. [Creating Your First Project](#creating-your-first-project)
4. [Development Workflow](#development-workflow)
5. [Testing Your App](#testing-your-app)
6. [Code Signing & Certificates](#code-signing--certificates)
7. [Building for Release](#building-for-release)
8. [Deployment Options](#deployment-options)
9. [App Store Submission](#app-store-submission)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Initial Setup & Requirements

### Hardware Requirements ✅

Your **Mac mini M4** is excellent for iOS development:
- **Apple Silicon (M4)**: Native performance for iOS simulator
- **Minimum 8GB RAM**: Recommended 16GB+ for smooth experience
- **50GB+ free disk space**: For Xcode, simulators, and projects
- **Stable internet**: For downloading tools and uploading builds

### Software Requirements

#### 1. macOS Version
- **Required**: macOS Sonoma (14.0) or later
- **Recommended**: Latest stable macOS version
- Check your version: ` > About This Mac`

#### 2. Apple ID
- **Required**: Free Apple ID for development
- **For App Store**: Apple Developer Program membership ($99/year)
- Create at: https://appleid.apple.com

#### 3. Xcode (Required)
- Apple's official IDE for iOS development
- **Size**: ~15GB download, ~40GB installed
- **Free** from Mac App Store

---

## Development Tools

### 1. Installing Xcode

#### Method A: Mac App Store (Recommended)
```bash
# Open App Store
open -a "App Store"

# Search for "Xcode" and click "Get" or "Install"
# This takes 30-60 minutes depending on internet speed
```

#### Method B: Direct Download
1. Visit https://developer.apple.com/download/
2. Sign in with Apple ID
3. Download latest Xcode
4. Install the `.xip` file

#### Post-Installation Setup
```bash
# Launch Xcode for first-time setup
open -a Xcode

# Accept license agreement (required)
# This opens automatically on first launch

# Install additional components
# Xcode will prompt you - click "Install"

# Set Xcode command line tools
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Verify installation
xcodebuild -version
# Should show: Xcode 15.x and Build version
```

### 2. Installing iOS Simulators

Simulators let you test without a physical iPhone/iPad.

```bash
# Open Xcode
# Go to: Xcode > Settings > Platforms

# Click "+" to add simulators
# Download recommended simulators:
# - Latest iOS version (e.g., iOS 17.x)
# - Previous iOS version (e.g., iOS 16.x)
# - iPad simulator
```

**Recommended Simulators**:
- iPhone 15 Pro (iOS 17.x) - Latest flagship
- iPhone SE (3rd gen) - Smaller screen testing
- iPad Pro 12.9" - Tablet layout testing
- iPhone 14 (iOS 16.x) - Backward compatibility

Each simulator download: ~5-8GB

### 3. Optional But Recommended Tools

#### A. Git (Version Control)
```bash
# Check if installed (comes with Xcode Command Line Tools)
git --version

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### B. CocoaPods (Dependency Manager)
```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

#### C. Homebrew (Package Manager)
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

#### D. SF Symbols App (Icon Library)
- Download: https://developer.apple.com/sf-symbols/
- Free Apple icon library for iOS apps

---

## Creating Your First Project

### Step-by-Step Project Creation

#### 1. Launch Xcode
```bash
open -a Xcode
```

#### 2. Create New Project
1. Click **"Create a new Xcode project"** or `File > New > Project`
2. Choose **iOS** tab
3. Select **"App"** template
4. Click **Next**

#### 3. Project Configuration

**Fill in the following**:

| Field | Value | Notes |
|-------|-------|-------|
| Product Name | `ProbeGame` | Your app name (no spaces) |
| Team | Select your Apple ID | Or "None" for now |
| Organization Identifier | `com.yourname` | Reverse domain format |
| Bundle Identifier | `com.yourname.ProbeGame` | Auto-generated, must be unique |
| Interface | **SwiftUI** | Modern UI framework |
| Language | **Swift** | Modern programming language |
| Storage | **SwiftData** | Modern data persistence |
| Include Tests | ✅ Checked | Recommended |

**Bundle Identifier Example**: `com.johndoe.ProbeGame`
- Must be globally unique for App Store
- Use your domain or name

#### 4. Choose Save Location
```bash
# Recommended location:
~/Developer/iOS/ProbeGame

# Create Developer folder if it doesn't exist:
mkdir -p ~/Developer/iOS
```

#### 5. Git Repository
- Check **"Create Git repository on my Mac"** ✅
- Enables version control from the start

Click **Create**!

### Understanding Xcode Interface

When Xcode opens, you'll see:

```
┌─────────────────────────────────────────────────────┐
│ Navigator (Left) │  Editor (Center)  │ Inspector    │
│                  │                    │ (Right)      │
│ - Files          │  - Code editor     │ - Properties │
│ - Search         │  - Interface       │ - Attributes │
│ - Issues         │  - Preview         │ - Help       │
│ - Tests          │                    │              │
│                  │                    │              │
│                  │                    │              │
└─────────────────────────────────────────────────────┘
│              Toolbar (Top)                           │
│  Run ▶ | Stop ◼ | Device Selector | Scheme          │
└─────────────────────────────────────────────────────┘
│              Debug Area (Bottom)                     │
│  Console output, variables, breakpoints              │
└─────────────────────────────────────────────────────┘
```

**Key Areas**:
1. **Navigator** (⌘1): Project files, search, issues
2. **Editor**: Where you write code
3. **Inspector** (⌘⌥0): Properties and settings
4. **Debug Area** (⌘⇧Y): Console and debugger
5. **Toolbar**: Build, run, stop controls

### Project Structure

```
ProbeGame/
├── ProbeGameApp.swift          # App entry point
├── ContentView.swift           # Main UI view
├── Assets.xcassets/            # Images, colors, icons
├── Preview Content/            # Preview assets
├── Info.plist                  # App configuration
└── ProbeGame.entitlements      # App capabilities

ProbeGameTests/                 # Unit tests
ProbeGameUITests/               # UI tests
```

---

## Development Workflow

### Daily Development Cycle

#### 1. Open Project
```bash
# Navigate to project directory
cd ~/Developer/iOS/ProbeGame

# Open project (double-click or terminal)
open ProbeGame.xcodeproj

# If using CocoaPods:
open ProbeGame.xcworkspace  # Use .xcworkspace instead!
```

#### 2. Select Target Device
In Xcode toolbar, click device selector:
```
iPhone 15 Pro (Simulator)  ▼
```

Options:
- **Simulators**: Test without physical device
- **My Mac (Designed for iPad)**: Run on Mac (for iPad apps)
- **Physical Devices**: Your connected iPhone/iPad

#### 3. Write Code

**SwiftUI Example** (ContentView.swift):
```swift
import SwiftUI

struct ContentView: View {
    @State private var score = 0

    var body: some View {
        VStack {
            Text("Probe Game")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Score: \(score)")
                .font(.title)

            Button("Add Point") {
                score += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
```

#### 4. Live Preview (SwiftUI)

**Enable Canvas**:
1. Open a SwiftUI file (e.g., ContentView.swift)
2. Press `⌘⌥↩` (Cmd+Option+Return) to show Canvas
3. Click **Resume** button if paused
4. See live updates as you code!

**Canvas Controls**:
- **Resume**: Start/refresh preview
- **Device selector**: Change preview device
- **Color scheme**: Toggle light/dark mode
- **Orientation**: Portrait/landscape

#### 5. Build & Run

**Keyboard Shortcuts**:
- `⌘R` - Build and Run
- `⌘B` - Build only
- `⌘.` - Stop running app

**First Run**:
1. Press `⌘R` (Run)
2. Xcode compiles code (30s-2min first time)
3. Simulator launches
4. App appears in simulator

**Build Process**:
```
Building → Compiling Swift files → Linking → Installing → Launching
```

Watch progress in Xcode toolbar and output console.

#### 6. Iterate & Test

**Development Loop**:
1. Write code
2. Check live preview (SwiftUI)
3. Run in simulator (`⌘R`)
4. Test functionality
5. Check console for errors
6. Fix issues
7. Repeat!

### Version Control with Git

#### Basic Git Workflow
```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Add main game board UI"

# View commit history
git log --oneline

# Create a branch for new feature
git checkout -b feature/scoring-system

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/scoring-system
```

#### Xcode Git Integration

**Using Xcode GUI**:
1. **View changes**: `View > Navigators > Source Control` (⌘2)
2. **Commit**: `Source Control > Commit`
3. **Push**: `Source Control > Push`
4. **Pull**: `Source Control > Pull`
5. **Branches**: `Source Control > Branch > New Branch`

**Viewing Changes**:
- Changes highlighted in editor (blue = modified, green = added)
- Click line numbers to see diff

---

## Testing Your App

### Testing Options Overview

| Testing Type | Purpose | When to Use |
|--------------|---------|-------------|
| **Simulator** | Quick testing during development | Daily development |
| **Physical Device** | Real hardware testing | Before release, hardware features |
| **Unit Tests** | Test individual functions | Automated testing |
| **UI Tests** | Test user interface | Automated UI testing |
| **TestFlight** | Beta testing with users | Pre-release testing |

### 1. Simulator Testing

#### Running on Simulator

**Step-by-Step**:
1. Select simulator: `iPhone 15 Pro (Simulator)` in toolbar
2. Press `⌘R` to run
3. Simulator launches (first time is slow, ~30s)
4. App installs and runs

#### Simulator Controls

**Keyboard Shortcuts**:
- `⌘1, ⌘2, ⌘3` - Scale simulator (100%, 75%, 50%)
- `⌘→` / `⌘←` - Rotate device
- `⌘⇧H` - Home button (single press)
- `⌘⇧H⌘⇧H` - Home button (double press, app switcher)
- `⌘L` - Lock screen
- `⌘K` - Toggle software keyboard

**Menu Options**:
```
I/O Menu:
├── Take Screenshot (⌘S)
├── Record Video
├── Keyboard > Toggle Software Keyboard
├── Location > Custom Location (GPS testing)
└── Shake Gesture
```

**Simulating Conditions**:
```bash
# From Simulator menu bar:
Features > Location > Apple (Cupertino)
Features > Toggle Appearance (Dark/Light mode)
```

#### Debugging in Simulator

**Console Output**:
- Open Debug Area: `⌘⇧Y`
- View print statements and errors
- Filter console output

**Breakpoints**:
1. Click line number in editor (blue indicator appears)
2. Run app (`⌘R`)
3. Execution pauses at breakpoint
4. Inspect variables in Debug Area
5. Step through code:
   - `F6` - Step over
   - `F7` - Step into
   - `F8` - Continue

**Print Debugging**:
```swift
print("Score updated: \(score)")
debugPrint(player)
dump(gameState)  // Detailed object dump
```

#### Common Simulator Issues

**Simulator is slow**:
```bash
# Reset simulator
Device > Erase All Content and Settings

# Or from terminal:
xcrun simctl erase all
```

**App not updating**:
```bash
# Clean build folder
⌘⇧K (Product > Clean Build Folder)

# Delete derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### 2. Physical Device Testing

#### Prerequisites

**Requirements**:
- iPhone or iPad with USB cable (USB-C for Mac mini M4)
- Device running iOS 16.0+ (for iOS 16 deployment target)
- Apple ID logged into Xcode
- Device in "Developer Mode"

#### Setting Up Device

**Step 1: Enable Developer Mode** (iOS 16+)

On your iPhone/iPad:
1. Go to **Settings > Privacy & Security**
2. Scroll to **Developer Mode**
3. Toggle ON
4. Restart device when prompted
5. Confirm when prompted after restart

**Step 2: Trust Computer**

1. Connect iPhone/iPad to Mac mini with USB cable
2. On device, tap **"Trust This Computer"**
3. Enter device passcode
4. On Mac, click **Trust** in Xcode if prompted

**Step 3: Add Device to Xcode**

1. Open Xcode
2. Go to **Window > Devices and Simulators** (`⌘⇧2`)
3. Your device should appear in left sidebar
4. If yellow warning appears, click "Fix" to resolve

#### Running on Device

**Step-by-Step**:
1. Select your device in Xcode toolbar: `Your iPhone Name`
2. Press `⌘R` to run
3. First time: Xcode provisions device (automatic)
4. App installs and launches on device

**First Run - Trust Developer**:
1. On device: **Settings > General > VPN & Device Management**
2. Under "Developer App", tap your Apple ID
3. Tap **Trust "Your Apple ID"**
4. Confirm
5. Re-run app from Xcode

#### Wireless Debugging (Optional)

**Setup** (iOS 16+):
1. Connect device via USB once
2. **Window > Devices and Simulators** (`⌘⇧2`)
3. Select device
4. Check **"Connect via network"**
5. Disconnect USB cable
6. Device shows WiFi icon when connected wirelessly

**Requirements**:
- Same WiFi network
- Mac mini and iPhone/iPad on same subnet

### 3. Automated Testing

#### Unit Tests

**Creating a Test**:
```swift
// ProbeGameTests/ScoringServiceTests.swift
import XCTest
@testable import ProbeGame

final class ScoringServiceTests: XCTestCase {
    var scoringService: ScoringService!

    override func setUp() {
        super.setUp()
        scoringService = ScoringService()
    }

    func testCardPointsCalculation() {
        // Test position 0 should be 5 points
        let points = scoringService.calculateCardPoints(position: 0)
        XCTAssertEqual(points, 5)
    }

    func testWordCompletionBonus() {
        let bonus = scoringService.applyWordCompletionBonus()
        XCTAssertEqual(bonus, 50)
    }

    func testInterruptionSuccess() {
        let bonus = scoringService.applyInterruptionBonus(success: true)
        XCTAssertEqual(bonus, 100)
    }
}
```

**Running Tests**:
- All tests: `⌘U`
- Single test: Click diamond icon next to test method
- View results: Test Navigator (`⌘6`)

**Test Coverage**:
```bash
# Enable code coverage
Edit Scheme > Test > Options > Code Coverage ✓

# View coverage
Report Navigator (⌘9) > Coverage tab
```

#### UI Tests

**Creating UI Test**:
```swift
// ProbeGameUITests/GameFlowTests.swift
import XCTest

final class GameFlowTests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testStartNewGame() {
        // Tap "New Game" button
        app.buttons["New Game"].tap()

        // Verify player setup screen appears
        XCTAssertTrue(app.staticTexts["Player Setup"].exists)

        // Enter player name
        let nameField = app.textFields["Player Name"]
        nameField.tap()
        nameField.typeText("Alice")

        // Start game
        app.buttons["Start Game"].tap()

        // Verify game board appears
        XCTAssertTrue(app.staticTexts["Turn: Alice"].exists)
    }
}
```

**Recording UI Tests**:
1. Place cursor in test method
2. Click red record button in bottom toolbar
3. Interact with app - Xcode records actions
4. Click stop to finish
5. Generated code appears in test

---

## Code Signing & Certificates

### Understanding Code Signing

**What is it?**
- Apple's security mechanism
- Verifies app authenticity
- Required for device testing and distribution
- Links app to developer identity

**Two Types**:
1. **Development**: Testing on your devices
2. **Distribution**: App Store, TestFlight, Ad-hoc

### Free Apple ID (Development Only)

**Limitations**:
- ❌ No App Store submission
- ❌ No TestFlight
- ❌ Limited to 3 apps per device
- ✅ Device testing (7 days expiry, auto-renewal)
- ✅ Simulator testing (unlimited)

**Setup**:
1. Xcode > Settings > Accounts
2. Click `+` > Add Apple ID
3. Sign in with your free Apple ID
4. Select your account
5. Click "Download Manual Profiles" (if needed)

### Apple Developer Program ($99/year)

**Benefits**:
- ✅ App Store distribution
- ✅ TestFlight beta testing
- ✅ Push notifications
- ✅ App Groups, HealthKit, etc.
- ✅ Advanced capabilities

**Enrollment**:
1. Visit https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with Apple ID
4. Follow enrollment process
5. Pay $99 (annual renewal)
6. Wait for approval (usually 24-48 hours)

### Automatic vs Manual Signing

#### Automatic Signing (Recommended)

**Setup**:
1. Select project in Navigator
2. Select target (e.g., ProbeGame)
3. Go to "Signing & Capabilities" tab
4. Check **"Automatically manage signing"** ✅
5. Select your Team (Apple ID or Developer account)
6. Xcode handles everything!

**What Xcode Does**:
- Creates certificates
- Generates provisioning profiles
- Registers devices
- Renews when needed

**When to Use**: Almost always (unless specific needs)

#### Manual Signing (Advanced)

**When Needed**:
- Enterprise distribution
- Specific provisioning profiles
- Multiple team workflows
- CI/CD pipelines

**Setup**:
1. Uncheck "Automatically manage signing"
2. Select provisioning profile manually
3. Manage certificates in Apple Developer portal

**Not recommended for beginners** - stick with automatic!

### Managing Certificates

**View Certificates**:
```bash
# Open Keychain Access
open -a "Keychain Access"

# Look under "My Certificates"
# You should see: "Apple Development: Your Name"
```

**Common Issues**:

**"Signing for ProbeGame requires a development team"**
- Solution: Add Apple ID in Xcode > Settings > Accounts
- Select Team in Signing & Capabilities

**"Failed to register bundle identifier"**
- Solution: Change Bundle Identifier to something unique
- Format: `com.yourname.uniqueappname`

**Certificate expired**
- Solution: Xcode auto-renews with automatic signing
- Or revoke and recreate in Developer portal

---

## Building for Release

### Build Configurations

**Debug vs Release**:

| Configuration | Purpose | Optimizations | Size |
|---------------|---------|---------------|------|
| **Debug** | Development testing | Minimal | Larger |
| **Release** | App Store, TestFlight | Full | Smaller |

**Checking Configuration**:
```
Product > Scheme > Edit Scheme
├── Run: Debug (default)
├── Test: Debug
├── Profile: Release
└── Archive: Release ✓
```

### Optimizing for Release

#### 1. Update Build Settings

**Select Project**:
1. Click project in Navigator
2. Select target (ProbeGame)
3. Build Settings tab
4. Search for settings below

**Key Settings**:

```swift
// Swift Compiler - Code Generation
Optimization Level (Release): -O (Optimize for Speed)

// Build Options
Enable Testability (Release): No

// Deployment
iOS Deployment Target: 16.0 (or your minimum)
```

#### 2. Update App Information

**General Tab**:
- **Display Name**: App name shown on home screen
- **Bundle Identifier**: Must be unique
- **Version**: E.g., 1.0.0 (major.minor.patch)
- **Build**: E.g., 1 (increment for each upload)

**Info.plist**:
```xml
<!-- Add app permissions if needed -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan QR codes</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Choose photos to share in game</string>
```

#### 3. App Icon & Assets

**App Icon Requirements**:
- **1024x1024px** PNG (no alpha channel)
- Additional sizes auto-generated

**Adding App Icon**:
1. Open **Assets.xcassets**
2. Click **AppIcon**
3. Drag 1024x1024 image to "App Store iOS" slot
4. Xcode generates other sizes

**Tools for Icon Creation**:
- Figma (design)
- Sketch (design)
- https://appicon.co/ (generate sizes)
- Canva (simple design)

#### 4. Clean Build

**Before Archive**:
```bash
# Clean build folder
⌘⇧K (Product > Clean Build Folder)

# Optional: Delete derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Build for release
⌘B
```

---

## Deployment Options

### Overview

```
┌─────────────────────────────────────────┐
│     Deployment Options                  │
├─────────────────────────────────────────┤
│  1. Simulator (Development)             │
│  2. Physical Device (Development)       │
│  3. TestFlight (Beta Testing)           │
│  4. App Store (Public Release)          │
│  5. Ad-hoc Distribution (Limited)       │
│  6. Enterprise (Corporate Apps)         │
└─────────────────────────────────────────┘
```

### 1. TestFlight (Beta Testing)

**What is TestFlight?**
- Apple's beta testing platform
- Up to 10,000 testers
- 90-day testing period
- Requires Developer Program ($99/year)

**TestFlight Workflow**:
```
Archive → Upload → TestFlight → Invite Testers → Feedback
```

#### Step-by-Step TestFlight Deployment

**Step 1: Archive Your App**

1. Select **"Any iOS Device (arm64)"** in toolbar
   - NOT a simulator
   - NOT a specific device
2. **Product > Archive** (or `⌘⇧B` doesn't work, use menu)
3. Wait for archive to complete (2-5 minutes)
4. Organizer window opens automatically

**Organizer Window**:
```
Archives > Your App > List of Archives
├── Version 1.0 (Build 1) - Today
└── [Distribute App] button
```

**Step 2: Distribute App**

1. Click **"Distribute App"**
2. Select **"TestFlight & App Store"**
3. Click **Next**
4. Select **"Upload"**
5. Click **Next**

**Step 3: Distribution Options**

Configure the following:

```
✅ Include bitcode: No (deprecated)
✅ Upload symbols: Yes (for crash reports)
✅ Manage Version and Build Number: Auto (Xcode manages)
```

Click **Next**

**Step 4: Signing**

- Select **"Automatically manage signing"**
- Xcode handles certificates
- Click **Next**

**Step 5: Review & Upload**

1. Review app information
2. Click **Upload**
3. Wait for upload (5-15 minutes)
4. Success message appears

**Step 6: App Store Connect**

1. Go to https://appstoreconnect.apple.com
2. Sign in with Developer account
3. Click **"My Apps"**
4. Select your app (or create new)

**If First Time**:
- Click **"+"** to add new app
- Fill in app information:
  - Platform: iOS
  - Name: Probe
  - Primary Language: English
  - Bundle ID: Select from dropdown
  - SKU: unique identifier (e.g., PROBE001)
  - User Access: Full Access

**Step 7: Configure TestFlight**

```
App Store Connect > Your App > TestFlight tab
├── Build appears after processing (10-30 min)
├── Add What to Test text
├── Add Beta App Description
└── Add Test Information
```

**Wait for Processing**:
- Status: "Processing" → "Ready to Test"
- Usually 10-30 minutes
- You receive email when ready

**Step 8: Add Testers**

**Internal Testing** (Apple Developer team, up to 100):
1. TestFlight > Internal Testing
2. Click **"+"** to add tester
3. Enter Apple IDs
4. Testers receive email invitation

**External Testing** (Public, up to 10,000):
1. TestFlight > External Testing
2. Click **"+"** to add group
3. Submit for Beta App Review (1-2 days)
4. After approval, add testers by email or public link

**Step 9: Testers Install App**

**Tester Instructions**:
1. Install **TestFlight** app from App Store
2. Open email invitation
3. Click **"View in TestFlight"**
4. Tap **"Accept"** and **"Install"**
5. App appears on home screen

**Testers Can**:
- Install/update app
- Send feedback (screenshots, comments)
- View build notes

### 2. App Store (Public Release)

**Requirements**:
- Apple Developer Program ($99/year)
- Completed app with all content
- App Store assets (screenshots, descriptions)
- Privacy policy (if collecting data)
- App Store review approval

**Timeline**:
- Submission → Review: 24-48 hours (average)
- Rejected? Fix and resubmit
- Approved? Choose release date

### 3. Ad-hoc Distribution (Limited)

**When to Use**:
- Share with specific users (not public)
- Up to 100 devices per year
- Testing outside TestFlight

**Not recommended** - TestFlight is easier!

---

## App Store Submission

### Prerequisites Checklist

**Technical**:
- ✅ App builds successfully
- ✅ No crashes or major bugs
- ✅ Tested on multiple devices/simulators
- ✅ All features working
- ✅ Follows Apple's Human Interface Guidelines
- ✅ Privacy permissions with clear descriptions

**App Store Content**:
- ✅ App name (30 characters max)
- ✅ Subtitle (30 characters max)
- ✅ Promotional text (170 characters, updatable)
- ✅ Description (4000 characters)
- ✅ Keywords (100 characters, comma-separated)
- ✅ Support URL
- ✅ Marketing URL (optional)
- ✅ Privacy policy URL (if collecting data)

**Screenshots** (Required):
- 6.7" iPhone (iPhone 15 Pro Max): 3-10 screenshots
- 12.9" iPad Pro: 3-10 screenshots (if iPad supported)
- Can use Xcode simulator

**App Icon**:
- ✅ 1024x1024px PNG (no alpha)

**Age Rating**:
- ✅ Complete questionnaire (violence, profanity, etc.)

### Creating App Store Listing

**Step 1: App Information**

```
App Store Connect > My Apps > Your App > App Information
├── Name: Probe
├── Subtitle: Classic Word Deduction Game
├── Primary Language: English (U.S.)
├── Category: Games > Word
├── Secondary Category: Games > Family (optional)
├── Content Rights: Check if you own rights
└── Age Rating: Configure (click Edit)
```

**Step 2: Pricing & Availability**

```
Pricing and Availability tab
├── Price: Select tier (Free, $0.99, $1.99, etc.)
├── Availability: Choose countries/regions
└── Pre-Order: Enable if desired
```

**Step 3: Prepare for Submission**

```
App Store Connect > Your App > iOS App > [+ Version]
├── Version: 1.0
└── Click "Create"
```

**Step 4: Version Information**

Fill in all required fields:

```
Screenshots and App Previews:
├── 6.7" Display (iPhone 15 Pro Max)
│   └── Upload 3-10 screenshots
└── 12.9" Display (iPad Pro)
    └── Upload 3-10 screenshots (if iPad supported)

Promotional Text: (Optional, updatable anytime)
"Challenge friends in this strategic word game!"

Description:
"Experience the classic Probe word game on your iPhone..."
(Write compelling, informative description)

Keywords:
"word,puzzle,probe,hangman,family,multiplayer,strategy"
(Max 100 characters, no spaces after commas)

Support URL:
https://yourwebsite.com/support

Marketing URL: (Optional)
https://yourwebsite.com/probe
```

**Step 5: General App Information**

```
App Store Information:
├── App Icon: Uploads automatically from build
├── Age Rating: Set previously
├── Copyright: 2025 Your Name
└── App Subtitle: Classic Word Deduction Game

App Review Information:
├── Contact Information:
│   ├── First Name: Your Name
│   ├── Last Name: Last Name
│   ├── Phone: +1-555-555-5555
│   └── Email: yourname@email.com
├── Demo Account: (If login required)
│   ├── Username: demo@test.com
│   └── Password: TestPassword123
└── Notes: "Thank you for reviewing our app..."
```

**Step 6: Version Release**

```
Choose version release method:
○ Automatically release after approval
○ Manually release after approval
○ Schedule for specific date
```

**Step 7: Submit Build**

1. Scroll to **Build** section
2. Click **"+"** to add build
3. Select uploaded build from TestFlight
4. Click **Done**

**Export Compliance**:
- Answer encryption questions
- Usually "No" for simple apps without encryption
- Click **Submit**

**Step 8: Submit for Review**

1. Scroll to top
2. Click **"Submit for Review"**
3. Confirm submission
4. Status changes to **"Waiting for Review"**

### App Review Process

**Timeline**:
```
Waiting for Review (0-24 hours)
         ↓
In Review (usually 24-48 hours)
         ↓
   ┌─────────────┐
   │             │
Rejected  ←or→  Approved
   │             │
Fix Issues   Release to Store
   │
Resubmit
```

**If Rejected**:
1. Read rejection message carefully
2. Check Resolution Center in App Store Connect
3. Fix issues
4. Update version or build number
5. Re-upload and resubmit

**Common Rejection Reasons**:
- Crashes or bugs
- Incomplete information
- Guideline violations
- Missing functionality shown in screenshots
- Privacy policy issues

**If Approved**:
- App goes live automatically (or scheduled date)
- Celebrate! 🎉
- Monitor reviews and crash reports

---

## Best Practices

### Development Best Practices

#### 1. Code Organization
```swift
// Use clear naming
var playerScore: Int  // Good
var ps: Int           // Bad

// Use extensions for organization
extension GameViewModel {
    // MARK: - Scoring
    func calculateScore() { }

    // MARK: - Turn Management
    func nextTurn() { }
}

// Use comments for complex logic
/// Calculates bonus points based on position value
/// - Parameter position: Card rack position (0-11)
/// - Returns: Point value for that position
func calculatePoints(for position: Int) -> Int {
    // Implementation
}
```

#### 2. Version Control
```bash
# Commit frequently with clear messages
git commit -m "Add card flip animation"  # Good
git commit -m "updates"                   # Bad

# Use branches for features
git checkout -b feature/multiplayer
git checkout -b fix/scoring-bug

# Don't commit sensitive data
# Add to .gitignore:
*.DS_Store
*.xcuserstate
Secrets.plist
```

#### 3. Asset Management
```
Assets.xcassets/
├── AppIcon (always included)
├── Colors/
│   ├── PrimaryColor
│   └── SecondaryColor
├── Images/
│   └── card-back
└── Symbols/
    └── star-icon

Use SF Symbols when possible (free, scalable)
```

#### 4. Performance
```swift
// Lazy loading for expensive operations
lazy var wordList: [String] = {
    loadWordsFromFile()
}()

// Use @State and @Binding appropriately
@State private var score = 0        // Local state
@Binding var playerName: String     // Passed from parent

// Avoid retain cycles
class GameViewModel {
    var onComplete: (() -> Void)?  // Weak if needed
}
```

### Testing Best Practices

#### 1. Test Early, Test Often
```swift
// Test critical functions
func testScoreCalculation()
func testWordValidation()
func testGameEndCondition()

// Aim for 70%+ code coverage for critical code
```

#### 2. Device Testing Matrix
```
Minimum testing:
├── iPhone SE (small screen)
├── iPhone 15 Pro (standard)
├── iPad (if supported)
├── iOS minimum version (16.0)
└── iOS latest version (17.x)
```

#### 3. Edge Cases
```swift
// Test boundary conditions
testWordWithMaxLength()  // 12 letters
testWordWithMinLength()  // 4 letters
testAllCardsRevealed()
testNoPlayers()
testSinglePlayer()
```

### Release Best Practices

#### 1. Versioning Strategy
```
Semantic Versioning: MAJOR.MINOR.PATCH
├── 1.0.0: Initial release
├── 1.1.0: New features (minor)
├── 1.1.1: Bug fixes (patch)
└── 2.0.0: Breaking changes (major)

Build Number: Auto-increment for each upload
```

#### 2. Pre-Release Checklist
- [ ] All features complete
- [ ] No known crashes
- [ ] Tested on multiple devices
- [ ] Performance optimized
- [ ] No TODO/FIXME in production code
- [ ] All warnings resolved
- [ ] Privacy descriptions added
- [ ] App Store assets ready
- [ ] TestFlight tested by others

#### 3. Post-Release
```
Monitor:
├── Crash reports (Xcode Organizer)
├── App Store reviews
├── User feedback
└── Analytics (if integrated)

Respond:
├── Fix critical bugs ASAP
├── Release hotfix (1.0.1)
└── Plan next update
```

---

## Troubleshooting

### Common Build Errors

#### 1. "Command CompileSwift failed"
```
Cause: Swift syntax error
Solution:
- Read error message carefully
- Check line number indicated
- Look for typos, missing brackets
- Clean build folder (⌘⇧K)
```

#### 2. "No such module"
```
Cause: Missing dependency or framework
Solution:
- Check import statements
- If using CocoaPods: pod install
- Clean and rebuild
```

#### 3. "Signing for X requires a development team"
```
Cause: No team selected
Solution:
- Xcode > Settings > Accounts
- Add Apple ID
- Select Team in Signing & Capabilities
```

#### 4. "The operation couldn't be completed"
```
Cause: Simulator or device connection issue
Solution:
- Restart Xcode
- Restart simulator
- Disconnect and reconnect device
- Clean build folder
```

### Common Runtime Errors

#### 1. App Crashes on Launch
```
Check:
- Console output (⌘⇧Y)
- Crash logs (Window > Devices > View Device Logs)
- Recent code changes
- Force unwrapping nil values (!)
```

#### 2. Slow Performance
```
Solutions:
- Profile with Instruments (⌘I)
- Check for memory leaks
- Optimize images (compress, use correct size)
- Lazy load data
```

#### 3. UI Not Updating
```
SwiftUI:
- Ensure @State, @Binding, @Observable used correctly
- Check if running on main thread
- Use .id() to force view refresh

UIKit:
- Dispatch UI updates to main thread:
  DispatchQueue.main.async { }
```

### Xcode Issues

#### 1. Xcode Running Slow
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reset simulator
xcrun simctl erase all

# Restart Xcode
```

#### 2. Simulator Won't Boot
```
Device > Erase All Content and Settings

# Or delete and recreate:
Window > Devices and Simulators
Right-click simulator > Delete
Click "+" to add new
```

#### 3. Can't Find Physical Device
```
1. Unlock device
2. Trust computer
3. Enable Developer Mode on device
4. Window > Devices and Simulators (check connected)
5. Try different USB cable/port
```

---

## Quick Reference

### Essential Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Build | `⌘B` |
| Run | `⌘R` |
| Stop | `⌘.` |
| Clean Build | `⌘⇧K` |
| Test | `⌘U` |
| Show/Hide Debug Area | `⌘⇧Y` |
| Show/Hide Navigator | `⌘0` |
| Show/Hide Inspector | `⌘⌥0` |
| Quick Open | `⌘⇧O` |
| Find in Project | `⌘⇧F` |
| Jump to Definition | `⌘-click` |
| Show Canvas (SwiftUI) | `⌘⌥↩` |

### Xcode Navigators (`⌘1-9`)

```
⌘1 - Project Navigator (files)
⌘2 - Source Control Navigator (git)
⌘3 - Symbol Navigator (code structure)
⌘4 - Find Navigator (search results)
⌘5 - Issue Navigator (errors/warnings)
⌘6 - Test Navigator (unit tests)
⌘7 - Debug Navigator (performance)
⌘8 - Breakpoint Navigator (breakpoints)
⌘9 - Report Navigator (builds/tests)
```

### Common Terminal Commands

```bash
# Open project
open ProjectName.xcodeproj

# List simulators
xcrun simctl list devices

# Reset simulator
xcrun simctl erase all

# Build from command line
xcodebuild -scheme ProbeGame -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Run tests from command line
xcodebuild test -scheme ProbeGame -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Archive from command line
xcodebuild archive -scheme ProbeGame -archivePath ./build/ProbeGame.xcarchive
```

---

## Resources & Learning

### Official Apple Resources

- **Documentation**: https://developer.apple.com/documentation/
- **WWDC Videos**: https://developer.apple.com/videos/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **SwiftUI Tutorials**: https://developer.apple.com/tutorials/swiftui

### Community Resources

- **Swift Forums**: https://forums.swift.org
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/swift
- **Ray Wenderlich**: https://www.raywenderlich.com
- **Hacking with Swift**: https://www.hackingwithswift.com
- **Apple Developer Forums**: https://developer.apple.com/forums/

### Tools

- **SF Symbols**: https://developer.apple.com/sf-symbols/
- **App Icon Generator**: https://appicon.co/
- **Screenshot Generator**: https://www.screensizes.app/
- **TestFlight**: Built into App Store Connect
- **Transporter** (for uploads): Mac App Store

---

## Summary Workflow

### Complete Development to App Store Flow

```
1. Setup (One-time)
   ├── Install Xcode
   ├── Add Apple ID
   └── Enroll in Developer Program ($99/year for App Store)

2. Development (Daily)
   ├── Write code
   ├── Test in simulator
   ├── Test on device
   ├── Commit to git
   └── Iterate

3. Beta Testing
   ├── Archive app (⌘⇧B with "Any iOS Device")
   ├── Upload to TestFlight
   ├── Invite testers
   ├── Gather feedback
   └── Fix issues

4. App Store Preparation
   ├── Prepare assets (screenshots, description)
   ├── Create app in App Store Connect
   ├── Fill in metadata
   └── Upload final build

5. Submission
   ├── Submit for review
   ├── Wait for approval (24-48 hours)
   ├── Fix issues if rejected
   └── Release to App Store

6. Post-Release
   ├── Monitor reviews and crashes
   ├── Plan updates
   └── Maintain app
```

---

## Conclusion

This guide covers the complete iOS development workflow from setup to App Store submission. Your **Mac mini M4** is perfect for iOS development with excellent simulator performance and build speeds.

### Next Steps

1. **Install Xcode** from Mac App Store
2. **Create test project** to familiarize yourself with Xcode
3. **Run on simulator** and physical device
4. **Start building Probe app** using the ProbeGameiOSPlan.md
5. **Test with TestFlight** before App Store release

### Key Takeaways

- ✅ Use **automatic signing** for simplicity
- ✅ Test on **simulators and real devices**
- ✅ Use **TestFlight** for beta testing
- ✅ Follow **Apple's guidelines** carefully
- ✅ **Version control** with Git from day one
- ✅ **Test thoroughly** before submission

Good luck with your iOS development journey! 🚀

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Platform**: Mac mini M4 (Apple Silicon)
**Xcode Version**: 15.x+
**Target iOS**: 16.0+
