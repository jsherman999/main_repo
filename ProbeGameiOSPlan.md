# Probe - iOS Game App Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for developing an iOS version of the classic word game "Probe" (originally by Parker Brothers, 1964). The app will support 2-4 players and faithfully recreate the strategic word-guessing gameplay while leveraging modern iOS technologies for an enhanced user experience.

---

## Game Overview

### What is Probe?

Probe is a multiplayer word game similar to Hangman, where players:
- Choose secret words (4-12 letters)
- Take turns asking opponents if they have specific letters
- Score points based on correctly guessed letters and their positions
- Can interrupt to guess complete words for bonus points
- Continue until all words are revealed

### Key Differentiators from Hangman
- Supports 2-4 players (not just 2)
- Position-based scoring system
- Strategic interruption mechanic
- Word length disguising with blanks
- All players remain active until the end

---

## Core Game Rules

### Setup Phase
1. **Player Count**: 2-4 players
2. **Word Selection**: Each player selects a secret word
   - Minimum: 4 letters
   - Maximum: 12 letters
   - Must be valid dictionary words (no proper nouns, no trademarks)
3. **Word Disguising**: Players can add blank cards before/after their word to hide the true length

### Gameplay Mechanics

#### Turn Structure
1. **Active Player** asks another player: "Do you have the letter [X]?"
2. **If YES**:
   - Opponent reveals ONE card showing that letter
   - Active player scores points based on card position
   - Turn continues - can ask same or different player
3. **If NO**:
   - Turn ends, passes to next player
   - If the "no" was for a blank card position: -50 point penalty

#### Scoring System

**Position Values** (12 positions on the rack):
```
Position:  1   2   3   4   5   6   7   8   9   10  11  12
Points:    5   10  15  15  10  5   5   10  15  15  10  5
```

**Bonuses & Penalties**:
- **+50 points**: Revealing the last card of a word
- **+100 points**: Successfully interrupting and guessing a complete word
- **-50 points**: Failed interruption attempt
- **-50 points**: Asking about a blank card position
- **-100 points**: Misspelling your own word during setup

#### Interruption Rule
- **When**: Any time during another player's turn
- **Requirement**: Target word must have 5+ unexposed cards
- **Action**: Player must identify every letter and blank in correct sequence
- **Success**: +100 points, word is completely revealed
- **Failure**: -50 points, play continues normally

#### Game End
- Game continues until **ALL** words are revealed
- Player with highest score wins

---

## iOS App Architecture

### Technology Stack

#### Core Technologies
- **Language**: Swift 5.9+
- **Minimum iOS Version**: iOS 16.0+
- **UI Framework**: SwiftUI
- **Architecture**: MVVM (Model-View-ViewModel)
- **State Management**: Combine + @Observable
- **Data Persistence**: SwiftData
- **Networking**: Multipeer Connectivity (for future multiplayer)

#### Third-Party Libraries
- **Dictionary/Word Validation**: Built-in UITextChecker or custom word list
- **Animations**: SwiftUI native animations
- **Haptics**: UIFeedbackGenerator for tactile feedback

### Project Structure

```
ProbeGame/
├── App/
│   ├── ProbeGameApp.swift
│   └── AppDelegate.swift
├── Models/
│   ├── Game.swift
│   ├── Player.swift
│   ├── Card.swift
│   ├── Word.swift
│   └── GameState.swift
├── ViewModels/
│   ├── GameViewModel.swift
│   ├── PlayerSetupViewModel.swift
│   └── WordInputViewModel.swift
├── Views/
│   ├── MainMenu/
│   │   ├── MainMenuView.swift
│   │   └── RulesView.swift
│   ├── Setup/
│   │   ├── PlayerSetupView.swift
│   │   └── WordInputView.swift
│   ├── Game/
│   │   ├── GameBoardView.swift
│   │   ├── PlayerRackView.swift
│   │   ├── CardView.swift
│   │   ├── TurnControlView.swift
│   │   ├── ScoreboardView.swift
│   │   └── InterruptionView.swift
│   └── Components/
│       ├── LetterKeyboard.swift
│       └── PlayerIndicator.swift
├── Services/
│   ├── DictionaryService.swift
│   ├── ScoringService.swift
│   ├── GameEngine.swift
│   └── AudioService.swift
├── Utilities/
│   ├── Constants.swift
│   ├── Extensions/
│   └── Haptics.swift
└── Resources/
    ├── Sounds/
    ├── WordLists/
    └── Assets.xcassets
```

---

## Data Models

### Game Model
```swift
@Observable
class Game {
    var id: UUID
    var players: [Player]
    var currentPlayerIndex: Int
    var gameState: GameState
    var turnHistory: [Turn]
    var settings: GameSettings

    enum GameState {
        case setup
        case wordInput
        case playing
        case paused
        case finished
    }
}
```

### Player Model
```swift
struct Player: Identifiable, Codable {
    var id: UUID
    var name: String
    var color: PlayerColor
    var score: Int
    var secretWord: Word?
    var isHuman: Bool
    var avatar: String
}
```

### Card Model
```swift
struct Card: Identifiable {
    var id: UUID
    var position: Int              // 0-11 (rack position)
    var letter: Character?         // nil for blank cards
    var isRevealed: Bool
    var pointValue: Int            // Based on position

    // Position-to-points mapping
    static let positionPoints = [5, 10, 15, 15, 10, 5, 5, 10, 15, 15, 10, 5]
}
```

### Word Model
```swift
struct Word {
    var letters: String
    var cards: [Card]
    var leadingBlanks: Int         // For disguising length
    var trailingBlanks: Int        // For disguising length
    var isComplete: Bool           // All cards revealed?

    var totalLength: Int {
        letters.count + leadingBlanks + trailingBlanks
    }
}
```

### Turn Model
```swift
struct Turn {
    var playerId: UUID
    var targetPlayerId: UUID
    var letter: Character
    var wasSuccessful: Bool
    var pointsScored: Int
    var cardRevealed: Card?
    var timestamp: Date
}
```

---

## User Interface Design

### Screen Flow

```
Launch
  ↓
Main Menu
  ↓
[New Game] → Player Setup (2-4 players)
  ↓
Word Input Screen (each player enters secret word)
  ↓
Game Board
  ↓
Game Over / Results
  ↓
[Play Again / Main Menu]
```

### Main Screens

#### 1. Main Menu
**Components**:
- App title with animated logo
- "New Game" button
- "How to Play" button
- "Settings" button
- "Game History" button (optional)

**Design Notes**:
- Clean, minimalist design
- Primary color scheme matching game theme
- Smooth transitions

#### 2. Player Setup Screen
**Components**:
- Player count selector (2-4)
- Player configuration cards:
  - Name input field
  - Color picker
  - Avatar selector
  - Human/AI toggle (for future AI implementation)
- "Next" button (enabled when valid)

**Validation**:
- At least 2 players required
- Unique names
- Unique colors

#### 3. Word Input Screen
**Components**:
- Current player indicator
- Word input field (4-12 letters)
- Real-time validation
- Word length display
- Blank card controls:
  - Leading blanks slider (0-8)
  - Trailing blanks slider (0-8)
  - Visual rack preview
- Privacy shield (hide word from others)
- "Confirm Word" button

**Validation**:
- 4-12 letter requirement
- Dictionary validation
- Total length (word + blanks) ≤ 12
- Visual feedback for invalid entries

#### 4. Game Board (Primary Screen)
**Layout**:

```
┌─────────────────────────────────────┐
│  [Scoreboard - Expandable]          │
├─────────────────────────────────────┤
│                                     │
│  Player 1's Rack                    │
│  [5][10][15][15][10][5]...         │
│  [C][ ][ ][ ][ ][ ][ ][ ]...       │
│                                     │
│  Player 2's Rack                    │
│  [5][10][15][15][10][5]...         │
│  [ ][ ][ ][ ][ ][ ][ ][ ]...       │
│                                     │
│  [Additional players' racks...]     │
│                                     │
├─────────────────────────────────────┤
│  Current Turn: Player 1             │
│  ┌───────────────────────────────┐ │
│  │ Select Player: [P2][P3][P4]  │ │
│  │ Letter Keyboard: A-Z          │ │
│  │ [Interrupt Button]            │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Components**:
- **Player Racks**:
  - Horizontal scrollable if needed
  - Cards show position values
  - Revealed cards show letters
  - Hidden cards show card back
  - Visual indicators for eliminated words

- **Turn Control Panel**:
  - Current player highlight
  - Opponent selector buttons
  - A-Z letter keyboard
  - "Interrupt to Guess" button (disabled if <5 cards hidden)

- **Scoreboard** (collapsible):
  - Player names, colors, scores
  - Turn indicator
  - Words remaining counter

**Animations**:
- Card flip animation when revealed
- Point increment animation
- Turn transition animation
- Penalty/bonus flash effects

#### 5. Interruption Modal
**Components**:
- Target player's rack (showing hidden positions)
- Letter input fields for each position
- Blank position indicators
- "Submit Guess" button
- "Cancel" button
- Warning text: "+100 if correct, -50 if wrong"

**Behavior**:
- Only appears when valid (5+ hidden cards)
- Full-screen modal to focus attention
- Letter-by-letter input with validation

#### 6. Game Over Screen
**Components**:
- Winner announcement with celebration animation
- Final score breakdown
- Reveal all secret words
- Statistics (optional):
  - Total turns
  - Best guess
  - Most valuable card
- "Play Again" button
- "Main Menu" button

---

## Feature Specifications

### Phase 1: Core Features (MVP)

#### Must-Have Features
1. ✅ **Complete game logic** following official rules
2. ✅ **2-4 human player support** (local play only)
3. ✅ **Word validation** using dictionary
4. ✅ **Accurate scoring system** with all bonuses/penalties
5. ✅ **Card revelation mechanics**
6. ✅ **Interruption system**
7. ✅ **Word disguising with blanks**
8. ✅ **Game state persistence** (save/resume)
9. ✅ **Turn history**
10. ✅ **Rules/tutorial screen**

#### Technical Requirements
- Support iPhone (portrait) and iPad (portrait/landscape)
- Smooth 60fps animations
- Haptic feedback for key interactions
- Sound effects (toggleable)
- Dark mode support
- Accessibility: VoiceOver, Dynamic Type

### Phase 2: Enhanced Features

#### Nice-to-Have Features
1. 🔄 **Undo last action**
2. 🎨 **Customizable themes**
3. 📊 **Game statistics** and history
4. 🏆 **Achievement system**
5. 💾 **Multiple save slots**
6. ⏱️ **Turn timer** (optional)
7. 🎵 **Background music**
8. 📖 **Word definition lookup** (after reveal)
9. 🎯 **Hint system** (for learning)
10. 📸 **Game screenshots/sharing**

### Phase 3: Advanced Features (Future)

1. 🤖 **AI opponents** with difficulty levels
2. 📱 **Online multiplayer** (Game Center)
3. 🏠 **Local network play** (Multipeer Connectivity)
4. 💬 **In-game chat** (online mode)
5. 🌍 **Leaderboards**
6. 🎁 **Daily challenges**
7. 🗣️ **Voice input** for letters
8. ♿ **Enhanced accessibility** features
9. 🌐 **Localization** (multiple languages/dictionaries)
10. ⌚ **Apple Watch companion** app

---

## Game Logic Implementation

### Core Services

#### 1. DictionaryService
**Responsibilities**:
- Load word list from file
- Validate word existence
- Filter valid words (4-12 letters, no proper nouns)
- Support multiple dictionaries (future: different languages)

**API**:
```swift
class DictionaryService {
    func isValidWord(_ word: String) -> Bool
    func loadDictionary() async throws
    func suggestWords(startingWith prefix: String) -> [String]
}
```

**Word List Source**:
- Use curated English word list (e.g., SCOWL - Spell Checker Oriented Word Lists)
- Filter to 4-12 letter words
- Remove proper nouns, offensive words
- ~50,000-100,000 words estimated

#### 2. ScoringService
**Responsibilities**:
- Calculate points for revealed cards
- Apply bonuses (word completion, interruption)
- Apply penalties (blank cards, failed interruption)
- Track score history

**API**:
```swift
class ScoringService {
    func calculateCardPoints(position: Int) -> Int
    func applyWordCompletionBonus() -> Int
    func applyInterruptionBonus(success: Bool) -> Int
    func applyBlankPenalty() -> Int
}
```

#### 3. GameEngine
**Responsibilities**:
- Manage game state transitions
- Validate moves
- Process turn actions
- Handle interruptions
- Determine game end condition

**API**:
```swift
class GameEngine {
    func startGame(with players: [Player])
    func processGuess(letter: Character, targetPlayer: Player) -> GuessResult
    func processInterruption(guess: String, targetPlayer: Player) -> InterruptionResult
    func nextTurn()
    func checkGameOver() -> Bool
    func calculateWinner() -> Player?
}
```

**State Machine**:
```
Setup → WordInput → Playing → GameOver
                        ↓↑
                      Paused
```

---

## User Experience Enhancements

### Animations

1. **Card Flip**: 3D flip animation when revealing (0.3s)
2. **Score Pop**: Number increment with scale animation
3. **Turn Transition**: Slide animation between players
4. **Interruption**: Modal slide-up with blur background
5. **Game Over**: Confetti/celebration particles for winner

### Haptic Feedback

- **Light tap**: Letter selection
- **Success haptic**: Correct guess
- **Error haptic**: Wrong guess
- **Heavy impact**: Word completion
- **Warning**: Interruption attempt

### Sound Effects

- Card flip sound (reveal)
- Success chime (correct letter)
- Error buzz (incorrect letter)
- Bonus fanfare (word completion, interruption success)
- Penalty sound (failed interruption)
- Turn change (subtle whoosh)
- Game over (winner celebration)

### Accessibility

- **VoiceOver**: Full support for all UI elements
- **Dynamic Type**: Support system font scaling
- **Reduce Motion**: Alternative animations
- **Color Blind Mode**: Pattern overlays on player colors
- **High Contrast**: Enhanced visual separation

---

## Technical Considerations

### Performance

- **Memory Management**:
  - Lazy loading for word lists
  - Efficient card rendering (SwiftUI performance)
  - Release resources when backgrounded

- **Battery Optimization**:
  - Reduce animation complexity in low power mode
  - Pause background animations when inactive

### Data Persistence

**Save Game Data**:
- Current game state (SwiftData)
- Player information
- Turn history
- Settings preferences

**UserDefaults**:
- Last game settings
- Player name/color preferences
- Audio/haptic preferences

### Error Handling

- Network errors (future online play)
- Dictionary loading failures
- Invalid game states
- Data corruption recovery

### Testing Strategy

1. **Unit Tests**:
   - Game logic (scoring, validation)
   - Dictionary service
   - State transitions

2. **UI Tests**:
   - Complete game flow
   - Edge cases (interruptions, penalties)
   - Multi-player scenarios

3. **Manual Testing**:
   - Full gameplay (2, 3, 4 players)
   - All scoring scenarios
   - Device rotation
   - Background/foreground

---

## Development Roadmap

### Sprint 1: Foundation (2 weeks)
- [ ] Project setup, architecture
- [ ] Data models
- [ ] Dictionary service
- [ ] Basic UI navigation
- [ ] Main menu screen

### Sprint 2: Core Gameplay (3 weeks)
- [ ] Player setup screen
- [ ] Word input screen
- [ ] Game board UI
- [ ] Card components
- [ ] Basic game engine
- [ ] Scoring service
- [ ] Turn management

### Sprint 3: Game Mechanics (2 weeks)
- [ ] Letter guessing logic
- [ ] Card revelation
- [ ] Score calculation
- [ ] Word completion detection
- [ ] Interruption system
- [ ] Game over logic

### Sprint 4: Polish & UX (2 weeks)
- [ ] Animations
- [ ] Sound effects
- [ ] Haptics
- [ ] Dark mode
- [ ] Accessibility
- [ ] Tutorial/Rules

### Sprint 5: Testing & Refinement (1 week)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] User testing feedback
- [ ] Final polish

### Sprint 6: Release Prep (1 week)
- [ ] App Store assets
- [ ] Marketing materials
- [ ] Privacy policy
- [ ] App Store submission

**Total Estimated Time**: 11 weeks (MVP)

---

## Potential Challenges & Solutions

### Challenge 1: Word List Quality
**Problem**: Ensuring dictionary contains appropriate words
**Solution**:
- Use established word lists (SCOWL)
- Manual curation of edge cases
- User reporting for inappropriate words

### Challenge 2: UI Complexity
**Problem**: Displaying 4 player racks on small screens
**Solution**:
- Scrollable rack layout
- Compact mode toggle
- Optimized iPad layout
- Focus on current player's turn

### Challenge 3: Preventing Cheating
**Problem**: Players seeing each other's secret words
**Solution**:
- Privacy shield between word entries
- "Pass device" prompt
- Face-down device during word entry
- Optional password protection per player

### Challenge 4: Turn Management
**Problem**: Keeping players engaged during others' turns
**Solution**:
- Quick animations
- Clear turn indicators
- Optional turn timer
- Visible score changes

---

## Monetization Strategy (Optional)

### Free Version
- Full gameplay with 2-4 players
- Basic themes
- Ad-supported (non-intrusive)

### Premium Version (One-time purchase or subscription)
- Ad-free experience
- Premium themes
- AI opponents
- Online multiplayer
- Statistics and achievements
- Cloud save sync

### Alternative: Freemium Model
- Core game free
- IAP for:
  - Theme packs ($0.99)
  - AI opponents ($1.99)
  - Online multiplayer ($2.99)
  - "Complete Pack" bundle ($4.99)

---

## App Store Information

### App Name
"Probe: The Word Game"

### Subtitle
"Classic word deduction for 2-4 players"

### Description
Experience the classic word game Probe on your iPhone and iPad! Challenge friends in this strategic word-guessing game where deduction meets vocabulary.

**Features**:
- 2-4 player local multiplayer
- Strategic gameplay with scoring mechanics
- Word disguising for added challenge
- Beautiful, intuitive interface
- Complete game history and statistics

Perfect for family game night, road trips, or casual word game fun!

### Keywords
probe, word game, word puzzle, vocabulary, hangman, multiplayer, family game, board game, guessing game, letters

### Category
Primary: Games
Secondary: Word

### Age Rating
4+ (suitable for all ages)

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Engagement**:
   - Average session duration: >15 minutes
   - Games completed per session: >1
   - Daily active users (DAU)
   - Weekly active users (WAU)

2. **Retention**:
   - Day 1 retention: >40%
   - Day 7 retention: >20%
   - Day 30 retention: >10%

3. **Quality**:
   - App Store rating: >4.5 stars
   - Crash-free rate: >99.5%
   - Average load time: <2 seconds

4. **Monetization** (if applicable):
   - Conversion rate to premium: >5%
   - ARPU (Average Revenue Per User)
   - LTV (Lifetime Value)

---

## Conclusion

This comprehensive plan outlines the development of a faithful iOS recreation of the classic Probe word game. By focusing on accurate game mechanics, intuitive UI/UX, and smooth performance, the app will deliver an engaging word game experience for 2-4 players.

The phased development approach ensures a solid MVP while allowing for future enhancements like AI opponents and online multiplayer. With careful attention to accessibility, polish, and user experience, this app has strong potential for success in the competitive word game market.

---

## Research Sources

- [Probe (parlor game) - Wikipedia](https://en.wikipedia.org/wiki/Probe_(parlor_game))
- [Probe | Board Game | BoardGameGeek](https://boardgamegeek.com/boardgame/2060/probe)
- [How to play Probe | Official Rules | UltraBoardGames](https://www.ultraboardgames.com/probe/game-rules.php)
- [Probe Game Rules - Our Pastimes](https://ourpastimes.com/probe-game-rules-5417705.html)
- [Probe (1964) – Board Game Guys](https://boardgameguys.com/probe/)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Status**: Planning Phase Complete - Ready for Development
