# AI Agent Generator

A comprehensive platform for creating, testing, and managing AI agents with enhanced UI/UX features.

## Overview

The AI Agent Generator is a full-stack application that provides a user-friendly interface for creating and managing AI agents. It features a modern React frontend with advanced UI/UX enhancements and a Node.js backend with OpenAI integration.

![AI Agent Generator](./generated-icon.png)

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

## Quick Start

1. Clone the repository

   ```bash
   git clone https://github.com/ohadonmicrosoft/AiAgentGen.git
   cd AiAgentGen
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
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

## Documentation

Comprehensive documentation is available in the `/doc` directory:

- [Project Structure](./doc/project-structure.md) - Complete map of the project's file structure
- [UI/UX Enhancement Plan](./doc/ui-ux-enhancement-plan.md) - Overview of UI/UX improvements
- Feature-specific documentation for all UI/UX enhancements

## Interactive Demos

The application includes interactive demos for all UI/UX enhancements:

- Color Palette Generator: `/palette-demo`
- Color Contrast Checker: `/contrast-checker-demo`
- Dynamic Spacing System: `/spacing-demo`
- Drag and Drop Functionality: `/drag-drop-demo`
- Infinite Scroll: `/infinite-scroll-demo`
- Performance Dashboard: `/performance-dashboard`
- Form Animations: `/form-demo`
- Typography System: `/typography-demo`

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
