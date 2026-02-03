import path from "path";
import { config } from "dotenv";
import { HistoryExporter, ExportOptions } from "./exporter";

config();

interface CliArgs {
  channel?: string;
  from?: string;
  to?: string;
  format?: "csv" | "markdown" | "yaml";
  output?: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--channel":
      case "-c":
        result.channel = nextArg;
        i++;
        break;
      case "--from":
        result.from = nextArg;
        i++;
        break;
      case "--to":
        result.to = nextArg;
        i++;
        break;
      case "--format":
      case "-f":
        if (nextArg === "csv" || nextArg === "md" || nextArg === "markdown" || nextArg === "yaml") {
          result.format = nextArg === "md" ? "markdown" : nextArg;
        } else {
          console.error(`Invalid format: ${nextArg}. Use 'yaml', 'csv', or 'md'.`);
          process.exit(1);
        }
        i++;
        break;
      case "--output":
      case "-o":
        result.output = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }

  return result;
}

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) {
    return undefined;
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    console.error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD.`);
    process.exit(1);
  }

  const [, year, month, day] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function printUsage(): void {
  console.log(`
Slack History Export

Usage:
  npm run dev -- --channel <name|id> [options]

Options:
  --channel, -c <name|id>  Channel to export (required)
  --from <YYYY-MM-DD>      Start date (optional)
  --to <YYYY-MM-DD>        End date (optional)
  --format, -f <yaml|csv|md>  Output format (default: yaml)
  --output, -o <dir>       Output directory (default: exports/)
  --help, -h               Show this help

Examples:
  npm run dev -- --channel general
  npm run dev -- --channel general --from 2026-01-01 --to 2026-01-31
  npm run dev -- --channel general --format csv
  npm run dev -- -c general -f csv -o ./my-exports
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const token = process.env.SLACK_USER_TOKEN;

  if (!token) {
    console.error("Error: SLACK_USER_TOKEN environment variable is required.");
    console.error("Copy .env.example to .env and set your token.");
    process.exit(1);
  }

  if (!args.channel) {
    console.error("Error: --channel is required.");
    printUsage();
    process.exit(1);
  }

  const options: ExportOptions = {
    channelId: args.channel,
    startDate: args.from ? parseDate(args.from) : undefined,
    endDate: args.to ? parseDate(args.to) : undefined,
    format: args.format ?? "yaml",
    outputDir: args.output ?? path.resolve(process.cwd(), "exports"),
  };

  const exporter = new HistoryExporter(token);

  try {
    const result = await exporter.export(options);
    console.log(`\nExport complete!`);
    console.log(`  File: ${result.filePath}`);
    console.log(`  Messages: ${result.messageCount}`);
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  }
}

main();
