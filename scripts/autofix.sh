#!/bin/bash

# Script to automatically fix code quality issues

echo "Starting automatic code quality fixes..."

# Run our custom fix script
echo "Running custom React JSX and test file fixes..."
npx tsx scripts/fix-react-jsx.ts

# Run the project's fix:all script
echo "Running project fix:all script..."
npm run fix:all

echo "All fixes completed!" 