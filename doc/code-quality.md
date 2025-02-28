# Code Quality Tools

This document outlines the code quality tools used in this project and how to use them effectively.

## Table of Contents

- [Dependency Management](#dependency-management)
- [Code Linting & Formatting](#code-linting--formatting)
- [Type Checking](#type-checking)
- [Testing](#testing)
- [Performance & Optimization](#performance--optimization)
- [Security](#security)
- [Continuous Integration](#continuous-integration)
- [Pre-commit Hooks](#pre-commit-hooks)

## Dependency Management

### NPM Audit

Automatically checks for security vulnerabilities in dependencies.

```sh
npm audit
npm audit fix  # Fixes vulnerabilities
```

### Dependabot

GitHub's Dependabot automatically creates pull requests for outdated dependencies. It's configured in `.github/dependabot.yml`.

### npm-check-updates (NCU)

Checks for outdated dependencies and updates them.

```sh
npx npm-check-updates     # Check for updates
npx npm-check-updates -u  # Update package.json
npm install               # Install updated packages
```

### Depcheck

Identifies unused dependencies.

```sh
npx depcheck
```

## Code Linting & Formatting

### ESLint

Ensures consistent code style and catches errors.

```sh
npm run lint      # Check for issues
npm run lint:fix  # Fix issues automatically
```

### Prettier

Automatically formats your code.

```sh
npm run format  # Format all files
```

### Biome

A modern JavaScript/TypeScript toolchain that includes linting, formatting, and more.

```sh
npx @biomejs/biome check .       # Check for issues
npx @biomejs/biome check --apply . # Fix issues automatically
```

## Type Checking

### TypeScript

Static type checking to catch errors before runtime.

```sh
npm run check  # Run TypeScript type checking
```

## Testing

### Jest

Unit and integration testing.

```sh
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:integration # Run integration tests
```

### Playwright

End-to-end and visual regression testing.

```sh
npm run test:e2e     # Run end-to-end tests
npm run test:visual  # Run visual regression tests
```

## Performance & Optimization

### Webpack Bundle Analyzer

Visualizes bundle sizes to optimize performance.

```sh
npm run analyze  # Analyze bundle size
```

### Lighthouse

Performance, accessibility, best practices, and SEO auditing.

```sh
npx lighthouse http://localhost:3000 --view
```

## Security

### Snyk

Finds and fixes security issues.

```sh
npx snyk test  # Check for vulnerabilities
```

### Helmet

Security for Express.js applications (already integrated in the server code).

## Continuous Integration

Our CI/CD pipeline runs all these checks automatically on pull requests and pushes to main branches. See `.github/workflows/ci.yml` for details.

## Pre-commit Hooks

Husky and lint-staged are configured to run linting and formatting on staged files before committing.

## All-in-One Maintenance Script

We've created a comprehensive script to run all maintenance tasks:

```sh
npm run maintain  # Run all maintenance tasks
```

This script:

1. Creates a backup of the project
2. Checks for outdated and unused dependencies
3. Runs linting and formatting
4. Performs type checking
5. Runs tests
6. Analyzes bundle size
7. Checks for security vulnerabilities

## Quick Commands

| Task                      | Command                  |
| ------------------------- | ------------------------ |
| Update dependencies       | `npm run update:deps`    |
| Security check            | `npm run security:check` |
| Format code               | `npm run format`         |
| Fix all linting issues    | `npm run fix:all`        |
| Run all maintenance tasks | `npm run maintain`       |
