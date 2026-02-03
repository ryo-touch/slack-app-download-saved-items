# Slack History Export

Export Slack channel history to Markdown or CSV format.

## Features

- Export public and private channel history
- Thread expansion (replies shown inline)
- Date range filtering
- User name resolution
- Multiple output formats (Markdown, CSV)

## Setup

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it (e.g., "History Export") and select your workspace

### 2. Configure OAuth Scopes

Go to **OAuth & Permissions** and add these **User Token Scopes**:

- `channels:history` - Read public channel messages
- `channels:read` - Get public channel info
- `groups:history` - Read private channel messages
- `groups:read` - Get private channel info
- `users:read` - Resolve user IDs to names

### 3. Install to Workspace

1. Click "Install to Workspace"
2. Authorize the app
3. Copy the **User OAuth Token** (starts with `xoxp-`)

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your token
```

### 5. Install Dependencies

```bash
npm install
```

## Usage

```bash
# Export all history as Markdown
npm run dev -- --channel general

# Export with date range
npm run dev -- --channel general --from 2026-01-01 --to 2026-01-31

# Export as CSV
npm run dev -- --channel general --format csv

# Specify output directory
npm run dev -- --channel general --output ./my-exports
```

## Output Formats

### Markdown (default)

```markdown
# #general

## 2026-02-02

### 09:15 @username
Message text here

> **09:20 @replier**
> Thread reply text
```

### CSV

```csv
timestamp,channel,user,text,thread_ts,reply_count
2026-02-02T09:15:00.000Z,general,username,Message text,,0
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--channel <name\|id>` | Channel to export (required) | - |
| `--from <YYYY-MM-DD>` | Start date | Beginning |
| `--to <YYYY-MM-DD>` | End date | Now |
| `--format <csv\|md>` | Output format | md |
| `--output <dir>` | Output directory | exports/ |

## License

ISC
