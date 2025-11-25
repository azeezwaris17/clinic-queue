// backend/scripts/build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ClinicQueue Backend Build...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    console.log('🧹 Cleaning dist directory...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Run TypeScript compiler
  console.log('📝 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // Copy package.json to dist (if needed)
  console.log('📋 Copying package.json...');
  fs.copyFileSync('package.json', 'dist/package.json');

  // Copy environment files
  if (fs.existsSync('.env.production')) {
    console.log('🔧 Copying environment files...');
    fs.copyFileSync('.env.production', 'dist/.env.production');
  }

  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: dist/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}