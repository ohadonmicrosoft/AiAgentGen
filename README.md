# AI Agent Generator

A comprehensive platform for creating, testing, and managing AI agents with enhanced UI/UX features.

## Overview

The AI Agent Generator is a full-stack application that provides a user-friendly interface for creating and managing AI agents. It features a modern React frontend with advanced UI/UX enhancements and a Node.js backend with OpenAI integration.

## Features

### Core Functionality

- Create, test, and manage AI agents
- Customize agent prompts and configurations
- Integrate agents with various platforms

### UI/UX Enhancements

- **Fluid Typography**: Responsive text sizing that scales with viewport
- **Dynamic Spacing System**: Responsive spacing that adapts to different screen sizes
- **Color Palette Generation**: Dynamic color palette creation with accessibility checks
- **Color Contrast Checker**: Ensures text meets WCAG accessibility standards
- **Drag and Drop Functionality**: Intuitive drag and drop interface with animations
- **Infinite Scroll**: Smooth loading of content as users scroll
- **Micro-interactions**: Subtle animations that enhance user experience
- **Performance Monitoring**: Tools to track and optimize application performance

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   └── index.html          # HTML entry point
├── server/                 # Backend Node.js application
│   ├── api/                # API endpoints
│   ├── lib/                # Server utilities
│   ├── __tests__/          # Server tests
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between client and server
├── config/                 # Configuration files
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   ├── jest.config.js      # Jest configuration
│   └── ...                 # Other configuration files
├── scripts/                # Utility scripts
│   ├── maintain.ts         # Maintenance script
│   ├── setup-db.ts         # Database setup script
│   └── ...                 # Other utility scripts
└── tests/                  # Integration and E2E tests
```

## Quick Start

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/ai-agent-generator.git
   cd ai-agent-generator
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=sqlite:./dev.db
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. Set up the database

   ```bash
   npm run setup-db
   ```

5. Start the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier
- `npm run fix:all` - Run all code quality tools
- `npm run maintain` - Run maintenance script to fix common issues

### Code Quality Tools

This project uses several tools to maintain code quality:

- **ESLint**: For JavaScript/TypeScript linting
- **Prettier**: For code formatting
- **Biome**: For additional code checks
- **Jest**: For testing
- **TypeScript**: For type checking

### Maintenance

To fix common issues in the codebase, run:

```bash
npx tsx scripts/maintain.ts
```

This script will:

- Fix React JSX imports
- Fix broken import statements
- Apply other common fixes

## Interactive Demos

The application includes interactive demos for all UI/UX enhancements:

- Color Palette Generator: `/palette-demo`
- Typography System: `/typography-demo`
- And more...

## Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Framer Motion
- React Query

### Backend

- Node.js
- Express
- OpenAI API
- SQLite (via Drizzle ORM)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Framer Motion for animation libraries
- Tailwind CSS for styling utilities
