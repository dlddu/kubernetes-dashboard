#!/bin/bash
# Setup permissions for test scripts in CI
# This ensures all scripts are executable

set -e

echo "Setting up permissions for test scripts..."

# Make all .sh files in test/ executable
find test -name "*.sh" -type f -exec chmod +x {} \;

# Make scripts directory executable if it exists
if [ -d "scripts" ]; then
  find scripts -name "*.sh" -type f -exec chmod +x {} \;
fi

echo "Permissions setup complete"
