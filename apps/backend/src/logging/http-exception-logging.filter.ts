import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { AppLogger } from "./app-logger.service";
import {
	buildRequestLogContext,
	sanitizeExceptionMessage,
} from "./http-log-context";

@Catch()
export class HttpExceptionLoggingFilter
	extends BaseExceptionFilter
	implements ExceptionFilter
{
	constructor(
		private readonly logger: AppLogger,
		httpAdapterHost: HttpAdapterHost,
	) {
		super(httpAdapterHost.httpAdapter);
	}

	catch(exception: unknown, host: ArgumentsHost) {
		const http = host.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
		const durationMs =
			typeof request?.receivedAt === "bigint"
				? Number(process.hrtime.bigint() - request.receivedAt) / 1_000_000
				: undefined;
		const metadata = {
			...buildRequestLogContext(
				request,
				response,
				durationMs ? Number(durationMs.toFixed(2)) : undefined,
			),
			...buildExceptionMetadata(exception),
		};

		if ((metadata.statusCode ?? 500) >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				"request_failed",
				metadata,
				HttpExceptionLoggingFilter.name,
			);
			super.catch(exception, host);
			return;
		}

		this.logger.warn(
			"request_failed",
			metadata,
			HttpExceptionLoggingFilter.name,
		);
		super.catch(exception, host);
	}
}

function buildExceptionMetadata(exception: unknown) {
	if (exception instanceof HttpException) {
		const statusCode = exception.getStatus();

		return {
			exceptionName: exception.name,
			statusCode,
			errorMessage: sanitizeExceptionMessage(exception.getResponse()),
			stack:
				statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
					? exception.stack
					: undefined,
		};
	}

	const error = exception instanceof Error ? exception : new Error(String(exception));
	return {
		exceptionName: error.name,
		statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
		errorMessage: sanitizeExceptionMessage(error.message),
		stack: error.stack,
	};
}
