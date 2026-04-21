import { Injectable, type LogLevel, LoggerService } from "@nestjs/common";
import pino, { type LevelWithSilent, type Logger as PinoLogger } from "pino";

type LogMetadata = Record<string, unknown>;

type ParsedLogArguments = {
	context?: string;
	metadata?: LogMetadata;
};

const PINO_LEVELS: Record<LogLevel, LevelWithSilent> = {
	fatal: "fatal",
	error: "error",
	warn: "warn",
	log: "info",
	debug: "debug",
	verbose: "trace",
};

@Injectable()
export class AppLogger implements LoggerService {
	readonly pino: PinoLogger = pino(
		{
			level: PINO_LEVELS[(process.env.LOG_LEVEL?.toLowerCase() as LogLevel) ?? "log"] ?? "info",
			base: undefined,
			timestamp: pino.stdTimeFunctions.isoTime,
			...(process.env.NODE_ENV !== "production"
				? {
						transport: {
							target: "pino-pretty",
							options: {
								colorize: true,
								ignore: "pid,hostname",
								translateTime: "SYS:standard",
							},
						},
					}
				: {}),
		},
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
		const { context, metadata } = parseOptionalParams(optionalParams);
		this.pino[PINO_LEVELS[level]](
			{
				context,
				...(metadata ?? {}),
			},
			typeof message === "string" ? message : JSON.stringify(message),
		);
	}
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
