import { Injectable, type LogLevel, LoggerService } from "@nestjs/common";

type LogMetadata = Record<string, unknown>;

type ParsedLogArguments = {
	context?: string;
	metadata?: LogMetadata;
};

type StructuredLogEntry = LogMetadata & {
	context?: string;
	level: LogLevel;
	message: string;
	timestamp: string;
};

const LOG_LEVEL_ORDER: LogLevel[] = [
	"fatal",
	"error",
	"warn",
	"log",
	"debug",
	"verbose",
];

@Injectable()
export class AppLogger implements LoggerService {
	private readonly activeLevels = new Set(
		resolveEnabledLevels(process.env.LOG_LEVEL ?? "log"),
	);

	log(message: unknown, ...optionalParams: unknown[]) {
		this.write("log", message, optionalParams);
	}

	error(message: unknown, ...optionalParams: unknown[]) {
		this.write("error", message, optionalParams);
	}

	warn(message: unknown, ...optionalParams: unknown[]) {
		this.write("warn", message, optionalParams);
	}

	debug(message: unknown, ...optionalParams: unknown[]) {
		this.write("debug", message, optionalParams);
	}

	verbose(message: unknown, ...optionalParams: unknown[]) {
		this.write("verbose", message, optionalParams);
	}

	fatal(message: unknown, ...optionalParams: unknown[]) {
		this.write("fatal", message, optionalParams);
	}

	private write(level: LogLevel, message: unknown, optionalParams: unknown[]) {
		if (!this.activeLevels.has(level)) {
			return;
		}

		const { context, metadata } = parseOptionalParams(optionalParams);
		const payload: StructuredLogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message: stringifyMessage(message),
			context,
			...(metadata ?? {}),
		};

		const line = `${JSON.stringify(payload)}\n`;
		if (level === "error" || level === "fatal" || level === "warn") {
			process.stderr.write(line);
			return;
		}

		process.stdout.write(line);
	}
}

function resolveEnabledLevels(rawLevel: string): LogLevel[] {
	const normalizedLevel = rawLevel.toLowerCase() as LogLevel;
	const thresholdIndex = LOG_LEVEL_ORDER.indexOf(normalizedLevel);
	const effectiveIndex =
		thresholdIndex === -1 ? LOG_LEVEL_ORDER.indexOf("log") : thresholdIndex;

	return LOG_LEVEL_ORDER.slice(0, effectiveIndex + 1);
}

function parseOptionalParams(optionalParams: unknown[]): ParsedLogArguments {
	const parsed: ParsedLogArguments = {};

	for (const param of optionalParams) {
		if (typeof param === "string") {
			parsed.context = param;
			continue;
		}

		if (param && typeof param === "object" && !Array.isArray(param)) {
			parsed.metadata = param as LogMetadata;
		}
	}

	return parsed;
}

function stringifyMessage(message: unknown): string {
	if (typeof message === "string") {
		return message;
	}

	return JSON.stringify(message);
}
