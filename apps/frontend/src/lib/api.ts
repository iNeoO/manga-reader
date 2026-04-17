import { getAuthToken } from "./auth";

type RequestOptions = {
	body?: BodyInit;
	headers?: HeadersInit;
	json?: unknown;
};

type RequestHandle = {
	json: <T>() => Promise<T>;
};

const apiPrefix = "/api";

const normalizePath = (input: string) => {
	const normalizedInput = `/${input.replace(/^\/+/, "").replace(/\/+$/, "")}`;

	if (
		normalizedInput === apiPrefix ||
		normalizedInput.startsWith(`${apiPrefix}/`)
	) {
		return normalizedInput;
	}

	return `${apiPrefix}${normalizedInput}`;
};

const createHeaders = (headers?: HeadersInit) => {
	const requestHeaders = new Headers(headers);
	const token = getAuthToken();

	if (token) {
		requestHeaders.set("authorization", token);
	} else {
		requestHeaders.delete("authorization");
	}

	return requestHeaders;
};

const createRequest = (
	method: string,
	input: string,
	options: RequestOptions = {},
): RequestHandle => {
	const { json, body, headers } = options;

	return {
		async json<T>() {
			const requestHeaders = createHeaders(headers);
			const requestInit: RequestInit = {
				method,
				headers: requestHeaders,
				body,
			};

			if (json !== undefined) {
				requestHeaders.set("content-type", "application/json");
				requestInit.body = JSON.stringify(json);
			}

			const response = await fetch(normalizePath(input), requestInit);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status} ${response.statusText}`);
			}

			return (await response.json()) as T;
		},
	};
};

export const api = {
	get: (input: string, options?: RequestOptions) =>
		createRequest("GET", input, options),
	post: (input: string, options?: RequestOptions) =>
		createRequest("POST", input, options),
	delete: (input: string, options?: RequestOptions) =>
		createRequest("DELETE", input, options),
};
