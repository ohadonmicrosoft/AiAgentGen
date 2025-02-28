#!/bin/bash

echo "Restoring original linting configuration..."

# Remove the .eslintignore file
rm -f .eslintignore

# Restore the original .eslintrc.json
if [ -f .eslintrc.json.backup ]; then
  mv .eslintrc.json.backup .eslintrc.json
  echo "Original .eslintrc.json has been restored."
else
  echo "Warning: Could not find .eslintrc.json.backup. Linting configuration may not be fully restored."
fi

echo "Linting has been restored. You may need to fix linting issues before committing."
