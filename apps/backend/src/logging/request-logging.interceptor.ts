import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { MetricsService } from "../metrics/metrics.service";
import { AppLogger } from "./app-logger.service";
import { buildRequestLogContext } from "./http-log-context";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
	constructor(
		private readonly logger: AppLogger,
		private readonly metricsService: MetricsService,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const receivedAt =
			typeof request?.receivedAt === "bigint"
				? request.receivedAt
				: process.hrtime.bigint();

		return next.handle().pipe(
			finalize(() => {
				const durationMs = Number(process.hrtime.bigint() - receivedAt) / 1_000_000;
				const requestContext = buildRequestLogContext(
					request,
					response,
					Number(durationMs.toFixed(2)),
				);
				this.metricsService.observeHttpRequest(requestContext);
				this.logger.pino.info(
					{
						context: RequestLoggingInterceptor.name,
						...requestContext,
					},
					"request_completed",
				);
			}),
		);
	}
}
