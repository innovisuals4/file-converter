@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM Transmute - One-Click GitHub Push
REM Asks for repo URL, adds files, commits, pushes - DONE
REM ================================================================

@echo off
echo.
echo ================================================================
echo  TRANSMUTE - GITHUB PUSH
echo ================================================================
echo.

REM Check project root
if not exist "package.json" (
    echo ERROR: Run from project root (package.json not found)
    pause
    exit /b 1
)

REM Get repo URL from user
echo.
set /p REPO_URL="Enter GitHub repo URL (https://github.com/user/repo.git): "

if "!REPO_URL!"=="" (
    echo ERROR: No URL provided
    pause
    exit /b 1
)

echo.
echo Repo: !REPO_URL!
echo.

REM Initialize git if needed
if not exist ".git" (
    echo Initializing git...
    git init >nul 2>&1
)

REM Set git user if not configured
git config user.email >nul 2>&1 || (
    git config user.email "deploy@transmute.local"
    git config user.name "Transmute Bot"
)

REM Add/Update remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin !REPO_URL!
) else (
    git remote set-url origin !REPO_URL!
)

REM Generate README
echo Generating README.md...
(
echo # Transmute - Every File. Any Format. One Powerful Converter.
echo.
echo [![Next.js](https://img.shields.io/badge/Next.js-16.4.4-black?logo=next.js)](https://nextjs.org/)
echo [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
echo [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
echo.
echo **Transmute** - Privacy-first file converter. 50+ formats, 26+ conversions, 8 PDF ops.
echo All processing in-browser. No uploads. No sign-ups. No stored files.
echo.
echo ## Features
echo - 26+ format conversions (Images, Docs, Sheets, Video, Audio, Archives, Fonts, Subtitles, Data)
echo - 8 PDF operations: Rotate, Delete, Extract, Reorder, Page Numbers, Watermark, Bates, Compress
echo - Privacy-first: 100% client-side processing
echo - Batch: Up to 10 files at once
echo - Stack: Next.js 16.4.4, TypeScript, Tailwind, Turbopack
echo.
echo ## Quick Start
echo \`\`\`bash
echo git clone https://github.com/USER/transmute.git
echo cd transmute
echo npm install
echo npm run dev
echo \`\`\`
echo.
echo ## Deploy
echo \`\`\`bash
echo npx vercel
echo \`\`\`
echo.
echo MIT License
) > README.md

echo Generating README.md...

REM Stage all
git add -A >nul 2>&1

REM Commit if changes
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Deploy: Transmute - Next.js 16.4.4 - 26+ conversions, 8 PDF ops" >nul 2>&1
)

REM Set remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin !REPO_URL!
) else (
    git remote set-url origin !REPO_URL!
)

REM Push
git branch -M main
git push -u origin main

REM Done
echo.
echo ================================================================
echo  DONE - Pushed to GitHub
echo ================================================================
echo.
echo Next: https://vercel.com/new -> Import repo -> Deploy
pause