# DevOps Setup Guide

This document explains the CI/CD, MCP services, and AI integration setup for HeySalad Wallet.

## 📋 Table of Contents

- [PR Templates](#pr-templates)
- [CI/CD Workflows](#cicd-workflows)
- [MCP Services](#mcp-services)
- [OpenAI Codex Integration](#openai-codex-integration)
- [GitHub Secrets Setup](#github-secrets-setup)
- [Local Development](#local-development)

---

## 🔄 PR Templates

### Location
`.github/PULL_REQUEST_TEMPLATE.md`

### Features
- Comprehensive checklist for all PR types
- Security verification steps
- Testing requirements (iOS/Android, physical devices, voice payments, biometrics)
- Documentation requirements
- Code quality checks

### Usage
When you create a new Pull Request on GitHub, the template will automatically populate. Fill out all relevant sections before requesting review.

---

## 🚀 CI/CD Workflows

### 1. CI - Tests & Code Quality (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### a) Test Job
- TypeScript type checking
- ESLint linting
- Security vulnerability audit

#### b) Code Quality Job
- Prettier formatting check
- TODO comments detection

#### c) Security Scan Job
- Trivy vulnerability scanner
- Uploads results to GitHub Security tab

#### d) Dependency Review Job
- Reviews dependencies on PRs
- Fails on high-severity vulnerabilities

### 2. EAS Build Workflow (`.github/workflows/eas-build.yml`)

**Triggers:**
- Push to `main` branch
- Tags starting with `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

**Jobs:**

#### a) Build Job
- Builds iOS and/or Android
- Supports `development`, `preview`, `production` profiles
- Configurable platform selection

#### b) Submit to Stores Job
- Automatically submits to App Store and Play Store
- Only runs on version tags (e.g., `v1.0.0`)

**Manual Trigger:**
Go to Actions → EAS Build → Run workflow
- Choose platform: `ios`, `android`, or `all`
- Choose profile: `development`, `preview`, or `production`

---

## 🔌 MCP Services

### Configuration
`mcp-config.json`

### Available Servers

#### 1. Filesystem Server
```bash
npx -y @modelcontextprotocol/server-filesystem /Users/chilumbam/heysalad-wallet
```
- Read/write access to project files
- File system operations

#### 2. GitHub Server
```bash
npx -y @modelcontextprotocol/server-github
```
- GitHub API access
- Issue and PR management
- Repository operations

**Required Environment Variable:**
```bash
export GITHUB_TOKEN="your_github_personal_access_token"
```

#### 3. Git Server
```bash
npx -y @modelcontextprotocol/server-git --repository /Users/chilumbam/heysalad-wallet
```
- Git operations
- Commit history
- Branch management

#### 4. Brave Search Server
```bash
npx -y @modelcontextprotocol/server-brave-search
```
- Web search capabilities
- Documentation lookup

**Required Environment Variable:**
```bash
export BRAVE_API_KEY="your_brave_api_key"
```

#### 5. PostgreSQL Server
```bash
npx -y @modelcontextprotocol/server-postgres postgresql://localhost/heysalad
```
- Database operations
- Future: Analytics and user data

### Setup MCP Servers

1. **Install MCP CLI**:
```bash
npm install -g @modelcontextprotocol/cli
```

2. **Start MCP Servers**:
```bash
mcp start --config mcp-config.json
```

3. **Configure Environment Variables**:
```bash
# .env.local (DO NOT COMMIT)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
BRAVE_API_KEY=BSAxxxxxxxxxxx
```

---

## 🤖 OpenAI Codex Integration

### Configuration
`.codex.yml`

### Features

#### AI Assistant Configuration
- **Model:** GPT-4 Turbo
- **Temperature:** 0.7 (balanced creativity)
- **Max Tokens:** 4000

#### Capabilities
- Code generation
- Code review
- Bug fixing
- Documentation generation
- Test generation
- Refactoring suggestions

#### Context Files
The AI assistant has access to:
- `README.md`
- `CHANGELOG.md`
- `ERROR_LOG.md`
- `package.json`
- `app.json`
- `eas.json`
- `tsconfig.json`

#### Code Style Enforcement
- TypeScript strict mode
- Functional React components
- Hooks-based architecture
- Consistent naming conventions

#### Security Patterns
Automatically detects and warns about:
- Private keys
- API keys
- Secrets
- Passwords
- Tokens
- Credentials

### Usage with GitHub Copilot

1. **Install GitHub Copilot**:
   - VS Code: Install "GitHub Copilot" extension
   - Enable in settings

2. **Configure for Project**:
   The `.codex.yml` file provides context to Copilot for better suggestions

3. **Use Copilot Chat**:
   ```
   @workspace How do I add a new voice command?
   @workspace Explain the biometric authentication flow
   @workspace Generate tests for TransactionReview component
   ```

### Usage with OpenAI Codex API

```typescript
// scripts/codex-assistant.ts
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateCode(prompt: string) {
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a TypeScript/React Native expert helping with HeySalad Wallet development.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0].message.content;
}

// Example usage
const code = await generateCode('Generate a function to validate TRON addresses');
console.log(code);
```

---

## 🔐 GitHub Secrets Setup

To use the CI/CD workflows, configure these secrets in your GitHub repository:

### Navigate to Secrets
1. Go to repository Settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"

### Required Secrets

#### 1. EXPO_TOKEN
```bash
# Generate token
eas login
eas whoami --json

# Copy the token and add to GitHub Secrets
```

#### 2. GITHUB_TOKEN (Optional - for MCP)
```bash
# Generate at https://github.com/settings/tokens
# Required scopes: repo, workflow
```

#### 3. BRAVE_API_KEY (Optional - for search)
```bash
# Get API key from https://brave.com/search/api/
```

#### 4. OPENAI_API_KEY (Optional - for Codex)
```bash
# Get API key from https://platform.openai.com/api-keys
```

---

## 💻 Local Development

### Run CI Checks Locally

```bash
# TypeScript check
bunx tsc --noEmit

# Lint
bun run lint

# Format check
bunx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

# Security audit
bun audit
```

### Test EAS Build Locally

```bash
# iOS
eas build --platform ios --profile preview --local

# Android
eas build --platform android --profile preview --local
```

### Start MCP Servers Locally

```bash
# Start all MCP servers
mcp start --config mcp-config.json

# Start specific server
npx -y @modelcontextprotocol/server-filesystem /Users/chilumbam/heysalad-wallet
```

---

## 📊 Monitoring & Debugging

### GitHub Actions
- View workflow runs: `https://github.com/Hey-Salad/heysalad-wallet/actions`
- Check logs for failed builds
- Re-run failed jobs

### EAS Build Status
- Dashboard: `https://expo.dev/accounts/heysalad/projects/heysalad-wallet/builds`
- View build logs
- Download artifacts

### Security Alerts
- GitHub Security tab shows Dependabot alerts
- Trivy scan results uploaded to Security > Code scanning

---

## 🎯 Best Practices

### Before Committing
```bash
# Run local checks
bunx tsc --noEmit && bun run lint && bunx prettier --write .

# Commit
git add -A
git commit -m "feat: add new feature"
```

### Before Creating PR
1. ✅ Fill out PR template completely
2. ✅ Run all tests locally
3. ✅ Check that build succeeds
4. ✅ Update CHANGELOG.md
5. ✅ Request review from at least one person

### Version Tagging
```bash
# Create a new version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# This triggers:
# 1. EAS Build workflow
# 2. Automatic submission to App Store/Play Store
```

---

## 🔧 Troubleshooting

### CI Workflow Fails

**Problem:** TypeScript errors
```bash
# Fix locally
bunx tsc --noEmit
# Fix all errors, then commit
```

**Problem:** Prettier formatting
```bash
# Auto-fix
bunx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
git add -A && git commit -m "style: format code"
```

### EAS Build Fails

**Problem:** Check EAS dashboard logs
```bash
# View logs
eas build:list
eas build:view [build-id]
```

**Problem:** Credentials issue
```bash
# Re-configure credentials
eas credentials
```

### MCP Server Won't Start

**Problem:** Missing environment variables
```bash
# Check if variables are set
echo $GITHUB_TOKEN
echo $BRAVE_API_KEY

# Set if missing
export GITHUB_TOKEN="your_token"
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [OpenAI Codex API](https://platform.openai.com/docs/guides/code)
- [GitHub Copilot](https://github.com/features/copilot)

---

**Last Updated:** 2025-11-08
**Author:** Claude (Anthropic) + HeySalad OÜ Team
