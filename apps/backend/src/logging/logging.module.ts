import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppLogger } from "./app-logger.service";
import { HttpExceptionLoggingFilter } from "./http-exception-logging.filter";
import { RequestLoggingInterceptor } from "./request-logging.interceptor";

@Global()
@Module({
	providers: [
		AppLogger,
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestLoggingInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: HttpExceptionLoggingFilter,
		},
	],
	exports: [AppLogger],
})
export class LoggingModule {}
