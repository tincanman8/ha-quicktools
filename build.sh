#!/bin/bash

# Exit immediately if any command fails
set -e

BUILD_DIR="build"
ZIP_NAME="extension.zip"
MANIFEST_PATH="src/manifest.json"

# Help function
show_help() {
    echo "Usage: ./build.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i, --increment   Auto-increment the version patch number in src/manifest.json"
    echo "  -h, --help        Show this help message and exit"
    exit 0
}

# Parse command line options
INCREMENT_VERSION=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -i|--increment) INCREMENT_VERSION=true; shift ;;
        -h|--help) show_help ;;
        *) echo "Unknown option: $1"; show_help ;;
    esac
done

# Optional: Auto-increment version function
if [ "$INCREMENT_VERSION" = true ]; then
    if [ ! -f "$MANIFEST_PATH" ]; then
        echo "❌ Error: $MANIFEST_PATH not found. Cannot increment version."
        exit 1
    fi
    echo "🔄 Auto-incrementing version patch..."
    
    # Extracts version, grabs the last digit, increments it, and updates manifest.json
    CURRENT_VERSION=$(grep '"version":' "$MANIFEST_PATH" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
    BASE_VERSION=$(echo "$CURRENT_VERSION" | sed -E 's/\.[0-9]+$//')
    PATCH_VERSION=$(echo "$CURRENT_VERSION" | sed -E 's/.*\.([0-9]+)$/\1/')
    NEW_PATCH=$((PATCH_VERSION + 1))
    NEW_VERSION="$BASE_VERSION.$NEW_PATCH"
    
    # Update the manifest file inline
    sed -i.bak -E "s/\"version\": *\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST_PATH"
    rm -f "${MANIFEST_PATH}.bak"
    echo "📈 Version bumped from $CURRENT_VERSION to $NEW_VERSION"
fi

echo "🚀 Starting extension build process..."
mkdir -p "$BUILD_DIR"

# 1. Package src contents into the build directory
echo "📦 Packaging src/ directory..."
cd src
zip -q -r "../$BUILD_DIR/$ZIP_NAME" .
cd ..

# 2. Append assets directory while preserving hierarchy
if [ -d "assets" ]; then
    echo "🎨 Appending assets/ folder..."
    zip -q -r "$BUILD_DIR/$ZIP_NAME" assets/
else
    echo "⚠️  Warning: assets/ folder not found. Skipping."
fi

# 3. Copy this build script into the build directory for reference
cp "$0" "$BUILD_DIR/"

echo "✅ Build complete! Archive created at: $BUILD_DIR/$ZIP_NAME"
