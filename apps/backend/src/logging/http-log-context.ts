type RequestUser = {
	sub?: string;
	userId?: string;
	username?: string;
};

type HttpRequestLike = {
	headers?: Record<string, string | string[] | undefined>;
	id?: string;
	ip?: string;
	method?: string;
	receivedAt?: bigint;
	routeOptions?: {
		url?: string;
	};
	routerPath?: string;
	url?: string;
	user?: RequestUser;
};

type HttpResponseLike = {
	getHeader?: (name: string) => number | string | string[] | undefined;
	statusCode?: number;
};

export type RequestLogContext = {
	authenticated: boolean;
	contentLength?: string;
	durationMs?: number;
	ip?: string;
	method?: string;
	referer?: string;
	requestId?: string;
	responseContentLength?: number | string | string[];
	route?: string;
	statusClass?: string;
	statusCode?: number;
	url?: string;
	userAgent?: string;
	userId?: string;
};

export function buildRequestLogContext(
	request: HttpRequestLike,
	response: HttpResponseLike,
	durationMs?: number,
): RequestLogContext {
	const statusCode = response.statusCode;
	const userId = request.user?.userId ?? request.user?.sub;

	return {
		requestId: request.id,
		method: request.method,
		url: request.url,
		route: request.routeOptions?.url ?? request.routerPath ?? request.url,
		statusCode,
		statusClass: statusCode ? `${Math.floor(statusCode / 100)}xx` : undefined,
		durationMs,
		userAgent: getHeader(request.headers, "user-agent"),
		ip: request.ip,
		contentLength: getHeader(request.headers, "content-length"),
		responseContentLength: response.getHeader?.("content-length"),
		referer: getHeader(request.headers, "referer"),
		authenticated: Boolean(userId),
		userId,
	};
}

export function sanitizeExceptionMessage(message: unknown): string | string[] {
	if (Array.isArray(message)) {
		return message.map((value) => String(value));
	}

	if (typeof message === "string") {
		return message;
	}

	if (message && typeof message === "object") {
		const nestedMessage = (message as { message?: unknown }).message;
		return sanitizeExceptionMessage(nestedMessage ?? "Unexpected error");
	}

	return "Unexpected error";
}

function getHeader(
	headers: Record<string, string | string[] | undefined> | undefined,
	name: string,
) {
	const value = headers?.[name];
	return Array.isArray(value) ? value[0] : value;
}
