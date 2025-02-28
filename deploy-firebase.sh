#!/bin/bash

# Exit on error
set -e

echo "🔥 Deploying Firebase configuration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
firebase projects:list &> /dev/null || {
    echo "Not logged in to Firebase. Please login:"
    firebase login
}

# Deploy Firestore rules
echo "📝 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules
echo "📦 Deploying Storage security rules..."
firebase deploy --only storage

# Build the application
echo "🏗️ Building the application..."
cd client && npm run build

# Deploy hosting
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete!" 