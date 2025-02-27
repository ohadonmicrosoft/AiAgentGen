# AI Agent Generator Project Structure

This document provides a comprehensive map of the project's directory and file structure.

## Overview

The project is organized into the following main sections:

- `/client` - Frontend React/TypeScript application
- `/server` - Backend Node.js/TypeScript application
- `/doc` - Documentation files
- `/shared` - Shared code between client and server
- Root configuration files

## Directory Structure

### High-Level Directory Structure

```
.
├── client/                           # Frontend application
├── server/                           # Backend application
├── doc/                              # Documentation
├── shared/                           # Shared code and utilities
├── attached_assets/                  # Asset files
└── [configuration files]             # Root level config files
```

### Client Directory Structure (Detailed)

```
client/src/                           # Source code
│
├── components/                       # UI components
│   ├── AgentCard.tsx                 # Card component for displaying agent info
│   ├── AgentTester.tsx               # Component for testing agents
│   ├── QuickActionCard.tsx           # Action card component
│   ├── Sidebar.tsx                   # Main application sidebar
│   ├── StatsCard.tsx                 # Statistics display card
│   ├── TopNav.tsx                    # Top navigation bar
│   ├── palette-generator.tsx         # Color palette generator component
│   ├── theme-toggle.tsx              # Theme toggle component
│   │
│   ├── ui/                           # Basic UI components
│   │   ├── accordion.tsx             # Accordion component
│   │   ├── alert-dialog.tsx          # Alert dialog component
│   │   ├── alert.tsx                 # Alert component
│   │   ├── animated-form-field.tsx   # Form field with animations
│   │   ├── button.tsx                # Button component
│   │   ├── card.tsx                  # Card component
│   │   ├── dialog.tsx                # Dialog component
│   │   ├── drag-handle.tsx           # Handle for drag and drop operations
│   │   ├── draggable.tsx             # Draggable component wrapper
│   │   ├── droppable.tsx             # Drop target component
│   │   ├── floating-label-input.tsx  # Input with floating label
│   │   ├── form.tsx                  # Form component
│   │   ├── loading-indicator.tsx     # Loading indicator component
│   │   ├── responsive-container.tsx  # Responsive container component
│   │   ├── tabs.tsx                  # Tabs component
│   │   ├── toast.tsx                 # Toast notification component
│   │   ├── toaster.tsx               # Toast notification manager
│   │   └── [many other UI components]
│   │
│   └── wizard/                       # Wizard/flow components
│       ├── AgentBasicInfo.tsx        # Agent creation step - basic info
│       ├── AgentConfiguration.tsx    # Agent creation step - configuration
│       ├── AgentPrompt.tsx           # Agent creation step - prompt definition
│       ├── AgentReview.tsx           # Agent creation step - final review
│       ├── AgentWizard.tsx           # Main wizard component for agent creation
│       └── WizardStepIndicator.tsx   # Step indicator for wizard
│
├── contexts/                         # React contexts
│   └── drag-context.tsx              # Context for drag and drop operations
│
├── hooks/                            # React hooks
│   ├── animations/                   # Animation-specific hooks
│   │   ├── index.ts                  # Entry point for animation hooks
│   │   ├── useMicroInteractions.ts   # Hook for micro-interaction animations
│   │   ├── usePageTransition.ts      # Hook for page transition animations
│   │   ├── useReducedMotion.ts       # Hook for detecting reduced motion preference
│   │   └── useScrollAnimation.ts     # Hook for scroll-based animations
│   │
│   ├── use-auth.tsx                  # Authentication hook
│   ├── use-draggable.tsx             # Hook for making elements draggable
│   ├── use-droppable.tsx             # Hook for making elements accept drops
│   ├── use-fluid-spacing.tsx         # Hook for fluid spacing system
│   ├── use-fluid-type.tsx            # Hook for fluid typography system
│   ├── use-form-animations.tsx       # Hook for form animations
│   ├── use-infinite-scroll.tsx       # Hook for infinite scroll implementation
│   ├── use-local-storage.tsx         # Hook for local storage access
│   ├── use-mobile.tsx                # Hook for mobile device detection
│   ├── use-performance.tsx           # Hook for performance monitoring
│   ├── use-reduced-motion.tsx        # Hook for reduced motion preference
│   ├── use-sidebar-state.tsx         # Hook for sidebar state management
│   ├── use-theme.tsx                 # Hook for theme management
│   └── use-toast.ts                  # Hook for toast notifications
│
├── layouts/                          # Page layouts
│   └── MainLayout.tsx                # Main application layout
│
├── lib/                              # Utility functions and libraries
│   ├── color-contrast.ts             # Color contrast calculation utilities
│   ├── color-palette.ts              # Color palette generation utilities
│   ├── drag-and-drop.ts              # Drag and drop utility functions
│   ├── fluid-spacing.ts              # Fluid spacing calculation utilities
│   ├── fluid-typography.ts           # Fluid typography calculation utilities
│   ├── page-transition.tsx           # Page transition animations
│   ├── performance-metrics.ts        # Performance monitoring utilities
│   ├── protected-route.tsx           # Route protection component
│   ├── queryClient.ts                # React Query client setup
│   ├── tailwind-fluid-spacing.ts     # Tailwind plugin for fluid spacing
│   └── utils.ts                      # General utility functions
│
├── pages/                            # Page components
│   ├── admin-agents.tsx              # Admin page for managing agents
│   ├── admin-users.tsx               # Admin page for managing users
│   ├── agents.tsx                    # Agents listing page
│   ├── auth-page.tsx                 # Authentication page
│   ├── contrast-checker-demo.tsx     # Demo for color contrast checker
│   ├── create-agent.tsx              # Page for creating new agents
│   ├── dashboard.tsx                 # Main dashboard page
│   ├── drag-drop-demo.tsx            # Demo for drag and drop functionality
│   ├── form-demo.tsx                 # Demo for form animations
│   ├── infinite-scroll-demo.tsx      # Demo for infinite scroll
│   ├── not-found.tsx                 # 404 page
│   ├── palette-demo.tsx              # Demo for color palette generator
│   ├── performance-dashboard.tsx     # Performance monitoring dashboard
│   ├── prompts-new.tsx               # New prompts page
│   ├── prompts.tsx                   # Prompts management page
│   ├── settings.tsx                  # Settings page
│   ├── spacing-demo.tsx              # Demo for spacing system
│   ├── test-agent.tsx                # Page for testing agents
│   └── typography-demo.tsx           # Demo for typography system
│
├── providers/                        # React providers
│   └── ThemeProvider.tsx             # Theme provider component
│
├── types/                            # TypeScript type definitions
│   └── drag-types.ts                 # Type definitions for drag and drop
│
├── App.tsx                           # Main application component
└── main.tsx                          # Application entry point
```

### Server Directory Structure

```
server/                               # Backend application
├── auth.ts                           # Authentication logic
├── db.ts                             # Database setup and queries
├── index.ts                          # Main server entry point
├── middleware.ts                     # Express middleware
├── openai.ts                         # OpenAI API integration
├── routes.ts                         # API route definitions
├── slack.ts                          # Slack integration
├── storage.ts                        # File/data storage
└── vite.ts                           # Vite configuration for backend
```

### Documentation Directory

```
doc/                                  # Documentation
├── README.md                         # Documentation overview
├── color-contrast-system-overview.md      # Color contrast system docs
├── color-palette-generator-overview.md    # Color palette generator docs
├── drag-and-drop-system-overview.md       # Drag and drop system docs
├── dynamic-spacing-system-overview.md     # Dynamic spacing system docs
├── infinite-scroll-system-overview.md     # Infinite scroll system docs
├── performance-monitoring-system-overview.md # Performance monitoring docs
├── project-structure.md                   # This file
└── ui-ux-enhancement-plan.md              # UI/UX enhancement plan
```

### Root Configuration Files

```
├── .gitignore                        # Git ignore rules
├── drizzle.config.ts                 # Drizzle ORM configuration
├── migrate.js                        # Database migration script
├── package-lock.json                 # Dependency lock file
├── package.json                      # Project configuration and dependencies
├── postcss.config.js                 # PostCSS configuration
├── setup-db.js                       # Database setup script
├── setup-db.ts                       # TypeScript version of DB setup
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── vite.config.ts                    # Vite build tool configuration
```

## Key Features and Components

### Client-Side

1. **UI Components**
   - Form components with animations
   - Dynamic spacing system
   - Fluid typography system
   - Color palette and theming
   - Drag and drop functionality
   - Infinite scroll

2. **Performance Features**
   - Performance monitoring tools
   - Metrics collection and visualization

3. **Accessibility Features**
   - Color contrast checking
   - Reduced motion support
   - Screen reader compatibility

### Server-Side

1. **API Integrations**
   - OpenAI integration for AI agents
   - Authentication system
   - Database access layer

2. **Data Management**
   - Storage utilities
   - Database migrations

## Documentation

The `/doc` directory contains comprehensive documentation for various systems implemented in the project, including:

- UI/UX enhancement plans
- Detailed system overviews for each major feature
- This project structure document

## Configuration

Various configuration files at the root level manage:

- TypeScript compilation
- Vite bundling
- Tailwind CSS styling
- PostCSS processing
- Database setup and migrations

## Major Implementation Features

### Drag and Drop System
Implementation spans across:
- `client/src/lib/drag-and-drop.ts` - Core utility functions
- `client/src/contexts/drag-context.tsx` - State management context
- `client/src/hooks/use-draggable.tsx` & `use-droppable.tsx` - Hooks for component integration
- `client/src/components/ui/draggable.tsx` & `droppable.tsx` - Reusable components
- `client/src/pages/drag-drop-demo.tsx` - Interactive demo

### Fluid Typography System
Implementation spans across:
- `client/src/lib/fluid-typography.ts` - Core calculations
- `client/src/hooks/use-fluid-type.tsx` - React hook integration
- Class utilities in Tailwind configuration

### Dynamic Spacing System
Implementation spans across:
- `client/src/lib/fluid-spacing.ts` - Core utility
- `client/src/lib/tailwind-fluid-spacing.ts` - Tailwind plugin
- `client/src/hooks/use-fluid-spacing.tsx` - React hook
- `client/src/pages/spacing-demo.tsx` - Interactive demo

### Performance Monitoring
Implementation spans across:
- `client/src/lib/performance-metrics.ts` - Core monitoring utilities
- `client/src/hooks/use-performance.tsx` - React integration
- `client/src/pages/performance-dashboard.tsx` - Visualization dashboard 