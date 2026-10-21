// Offline Instant Windows .exe Packager for TermFX Studio
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
const outDir = path.join(rootDir, 'dist', 'TermFX-win32-x64');
const appResourcesDir = path.join(outDir, 'resources', 'app');

console.log('Building standalone TermFX.exe from local Electron runtime...');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(electronDist, outDir, { recursive: true });

// Remove default_app.asar so Electron boots our app directly
const defaultAsar = path.join(outDir, 'resources', 'default_app.asar');
if (fs.existsSync(defaultAsar)) {
  fs.rmSync(defaultAsar, { force: true });
}

// Copy application files into resources/app
fs.mkdirSync(appResourcesDir, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(appResourcesDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'main.js'), path.join(appResourcesDir, 'main.js'));
fs.copyFileSync(path.join(rootDir, 'preload.js'), path.join(appResourcesDir, 'preload.js'));
fs.cpSync(path.join(rootDir, 'src'), path.join(appResourcesDir, 'src'), { recursive: true });

// Rename electron.exe -> TermFX.exe
const srcExe = path.join(outDir, 'electron.exe');
const targetExe = path.join(outDir, 'TermFX.exe');
if (fs.existsSync(srcExe)) {
  fs.renameSync(srcExe, targetExe);
}

console.log('SUCCESS! Standalone executable created at:');
console.log(targetExe);
