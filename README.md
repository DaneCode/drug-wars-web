# Drug Wars - Classic Economic Simulation Game

A modern web-based recreation of the classic TI-83 calculator game "Drug Wars". Built with HTML, CSS, and JavaScript featuring enhanced gameplay mechanics, story integration, and full mobile support.

## 🎮 Play the Game

[**Play Drug Wars Online**](https://yourusername.github.io/drug-wars-game/)

## 📖 About

Drug Wars is a turn-based economic simulation game where players travel between different locations, buying and selling various items to maximize profit while managing limited inventory space and navigating random events. This enhanced web version includes story progression, vehicle ownership, expanded inventory systems, and contextual events that adapt to your gameplay style.

## 🎯 Features

### Core Gameplay
- **Multiple Difficulty Levels**: Easy (45 days, $5,000), Medium (30 days, $2,000), Hard (20 days, $1,000)
- **6 Unique Locations**: Travel between Bronx, Ghetto, Central Park, Manhattan, Coney Island, and Brooklyn
- **6 Tradeable Items**: Each with unique price ranges, volatility, and market dynamics
- **Dynamic Market System**: Prices fluctuate based on location modifiers and random events

### Enhanced Vehicle System
- **Vehicle Ownership**: Purchase and own multiple vehicles permanently
- **Vehicle Collection**: Switch between owned vehicles anytime for free
- **Safety Benefits**: Each vehicle provides different levels of risk reduction
- **Visual Indicators**: Clear UI showing owned, current, and available vehicles

### Smart Event System
- **Contextual Events**: Police encounters only occur when carrying contraband
- **Performance-Based**: Event frequency and types adapt to your success level
- **Story Integration**: Narrative events that respond to your gameplay choices
- **Risk Management**: Vehicle upgrades reduce negative event probability

### Advanced Inventory
- **Expandable Capacity**: Start with 100 units, expand up to 300 units through events
- **Smart Validation**: Prevents purchases when inventory is full
- **Real-time Tracking**: Live inventory status with capacity warnings
- **Value Calculation**: See current market value of your entire inventory

### Quality of Life
- **Persistent Events**: Travel events stay visible until you choose to continue
- **Save/Load System**: Automatic saving with manual load option
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: Full keyboard navigation and screen reader support
- **GitHub Pages Ready**: Optimized for static hosting with service worker support

## 🚀 Getting Started

### Playing Online
Simply visit the [game page](https://DaneCode.github.io/drug-wars-web/) and start playing immediately.

### Local Development
1. Clone this repository
2. Open `index.html` in your web browser
3. No build process required - it's pure HTML/CSS/JavaScript!

## 🎮 How to Play

### Getting Started
1. **Choose Difficulty**: Select your challenge level and starting resources
2. **Read the Story**: Follow the narrative introduction to understand your situation
3. **Learn the Market**: Check item prices and availability at your starting location

### Core Gameplay Loop
1. **Buy Low**: Purchase items when prices are favorable
2. **Travel Smart**: Move to locations with better selling opportunities
3. **Sell High**: Maximize profits by timing your sales
4. **Manage Risk**: Handle random events and police encounters
5. **Upgrade Vehicles**: Build your vehicle collection for safer travel
6. **Expand Capacity**: Look for opportunities to increase inventory space

### Advanced Strategies
- **Market Timing**: Prices change when you travel - plan your routes
- **Vehicle Collection**: Own multiple vehicles and switch based on your needs
- **Risk vs Reward**: Carrying more items increases police encounter consequences
- **Story Awareness**: Your performance affects future story events and opportunities

## 🎯 Game Mechanics

### Items & Pricing
- **Acid**: High-value, high volatility ($1,000-4,000)
- **Cocaine**: Premium item, moderate variance ($15,000-30,000)
- **Hashish**: Medium-value, stable pricing ($300-600)
- **Heroin**: High-value, moderate variance ($5,000-14,000)
- **Ludes**: Low-value, high volatility ($10-60)
- **Weed**: Medium-value, stable pricing ($300-900)

### Locations & Markets
- **Bronx**: Starting location, balanced markets
- **Ghetto**: Lower prices, higher risks
- **Central Park**: Higher prices, police presence
- **Manhattan**: Premium market, highest prices
- **Coney Island**: Tourist area, moderate prices
- **Brooklyn**: Local network, standard pricing

### Vehicle System
- **On Foot**: Free, high risk (0% safety bonus) - always owned
- **Skateboard**: $50, slight safety improvement (15% risk reduction)
- **Bicycle**: $200, moderate safety (30% risk reduction)  
- **Car**: $5,000, maximum safety (50% risk reduction)

**New Features:**
- **Permanent Ownership**: Once purchased, vehicles are owned forever
- **Free Switching**: Change between owned vehicles anytime at no cost
- **Collection Building**: Accumulate your vehicle fleet over multiple games
- **Visual Status**: Clear indicators show owned vs. available vehicles

## 🛠 Technical Details

### Requirements
- Modern web browser with JavaScript enabled
- Local storage support for save/load functionality
- No server or internet connection required after initial load

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance
- Lightweight: ~100KB total size
- Fast loading: <1 second on modern connections
- Responsive: 60fps animations and smooth interactions
- Accessible: WCAG 2.1 AA compliant

## 🔧 Development

### File Structure
```
drug-wars-game/
├── index.html              # Main game page with enhanced UI
├── game.js                # Core game engine and logic (4700+ lines)
├── styles.css             # Responsive design and accessibility
├── manifest.json          # PWA manifest for mobile installation
├── sw.js                  # Service worker for offline support
├── comprehensive-test.html # Complete testing suite
├── robots.txt             # SEO optimization
├── sitemap.xml            # Search engine sitemap
├── browserconfig.xml      # Windows tile configuration
└── README.md              # This documentation
```

### Key Classes
- **GameEngine**: Core game state management with enhanced vehicle ownership
- **UIManager**: Advanced interface rendering with contextual displays
- **EventSystem**: Smart event generation that adapts to player inventory and performance
- **MarketSystem**: Dynamic price generation with location-based modifiers
- **StoryManager**: Narrative progression that responds to gameplay choices
- **SaveSystem**: Robust local storage with backward compatibility

### Recent Enhancements
- **Enhanced Vehicle Ownership**: Permanent vehicle collection system
- **Smart Police Events**: Contextual encounters based on inventory status
- **Improved Event Display**: Events remain visible until player continues
- **Better Initialization**: Resolved timing issues and state management
- **Comprehensive Testing**: Full test suite for all game systems

### Testing
Open `comprehensive-test.html` to run the complete test suite including:
- Game initialization and state management
- Market system and trading mechanics  
- Vehicle ownership and switching
- Event system and contextual triggers
- Save/load functionality
- UI integration and button functionality
- Debug tools and diagnostics

## 📱 Mobile & PWA Support

The game is fully optimized for all devices:
- **Touch-Friendly**: Large buttons and intuitive touch interactions
- **Responsive Layout**: Adapts seamlessly to any screen size
- **PWA Ready**: Install on mobile home screens like a native app
- **Offline Support**: Service worker enables offline play after initial load
- **Performance Optimized**: Fast loading with resource hints and preloading
- **Cross-Browser**: Works consistently across all modern browsers

## ♿ Accessibility

- Full keyboard navigation support
- Screen reader compatibility with ARIA labels
- High contrast mode support
- Reduced motion preferences respected
- Skip links for efficient navigation
- Focus management for dynamic content

## 🎨 Customization

The game uses CSS custom properties for easy theming. Key variables include:
- `--primary-color`: Main accent color (default: #00ff00)
- `--background-color`: Main background (default: #1a1a1a)
- `--text-color`: Primary text color (default: #00ff00)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 🎮 Original Game

This is a recreation of the classic "Drug Wars" game that was popular on TI-83 calculators. The original game was created by John E. Dell and has been recreated many times across different platforms.

---

**Disclaimer**: This game is a recreation of a classic calculator game and is intended for entertainment purposes only. It does not promote or endorse any illegal activities.