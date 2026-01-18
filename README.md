# Learn the French Basics

An interactive web application to learn essential French vocabulary for vacation planning. Practice greetings, numbers, travel terms, dining, shopping, and more through engaging game modes.

## Features

- 🎮 **Three Game Modes**:
  - **Flashcards**: Flip cards to learn French words and phrases
  - **Quiz**: Test your knowledge with multiple choice questions
  - **Matching**: Match French words with their English translations

- 📚 **8 Vocabulary Categories**:
  - Greetings & Polite Expressions
  - Numbers (1-100)
  - Travel & Transportation
  - Accommodation
  - Dining
  - Shopping
  - Directions
  - Emergency & Health

- 📊 **Progress Tracking**:
  - Track learned words per category
  - Daily streak counter
  - Total score tracking
  - Visual progress indicators

- 💾 **Local Storage**:
  - All progress saved locally in your browser
  - No account or login required
  - Works completely offline after first load

- 📱 **Responsive Design**:
  - Works on desktop, tablet, and mobile devices
  - Modern, intuitive user interface

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

To build the application for static hosting:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder that can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Deployment

This application is a static site and can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder or connect your Git repository
- **Vercel**: Connect your repository or use the Vercel CLI
- **GitHub Pages**: Build and push the `dist` folder to the `gh-pages` branch
- **Any web server**: Simply upload the contents of the `dist` folder

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Main dashboard with category selection
│   ├── Flashcard.jsx    # Flashcard game mode
│   ├── Quiz.jsx         # Quiz game mode
│   ├── Matching.jsx     # Matching game mode
│   └── GameResults.jsx  # Results screen
├── data/
│   └── vocabulary.json  # Vocabulary data
├── utils/
│   └── progressStorage.js  # LocalStorage utilities
├── App.jsx              # Main app component
└── main.jsx             # Entry point
```

## Customization

### Adding More Words

Edit `src/data/vocabulary.json` to add more words or categories. Each word should have:

- `id`: Unique identifier
- `french`: French word or phrase
- `english`: English translation
- `pronunciation`: Optional pronunciation guide
- `example`: Optional example sentence

### Styling

Styles are organized by component in the `src/components/` directory. The main app styles are in `src/App.css` and global styles in `src/index.css`.

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern features
- **LocalStorage API** - Progress persistence

## License

This project is open source and available for personal use and learning.

## Contributing

Feel free to fork this project and customize it for your own language learning needs!

## Tips for Learning

1. **Start with Greetings**: Begin with the greetings category to learn basic conversational phrases
2. **Practice Daily**: Try to maintain a daily streak for consistent learning
3. **Mix Game Modes**: Use different game modes to reinforce learning in various ways
4. **Review Regularly**: Revisit categories you've completed to maintain retention
5. **Focus on Pronunciation**: Pay attention to the pronunciation guides for better speaking skills

Bon voyage et bonne chance! 🚀