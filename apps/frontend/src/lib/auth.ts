import Cookies from "js-cookie";

const env = import.meta.env as Record<string, string | undefined>;

export const tokenCookieName = env.VITE_COOKIE_TOKEN_NAME ?? "access_token";

export const tokenCookieDuration = Number(env.VITE_COOKIE_TOKEN_DURATION ?? 1);

const parseBoolean = (value: string | undefined) => {
	if (value === undefined) {
		return;
	}

	return value === "true";
};

const isHttps =
	typeof window !== "undefined" && window.location.protocol === "https:";

const tokenCookieSecure = parseBoolean(env.VITE_COOKIE_TOKEN_SECURE) ?? isHttps;
const tokenCookieSameSite = env.VITE_COOKIE_TOKEN_SAME_SITE ?? "lax";

const tokenCookieOptions = {
	expires: tokenCookieDuration,
	secure: tokenCookieSecure,
	sameSite: tokenCookieSameSite as "lax" | "strict" | "none",
};

export const getAuthToken = () => {
	const token = Cookies.get(tokenCookieName);
	if (token) {
		return `Bearer ${token}`;
	}
	return;
};

export const setAuthToken = (token: string) => {
	Cookies.set(tokenCookieName, token, tokenCookieOptions);
};

export const clearAuthToken = () => {
	Cookies.remove(tokenCookieName, tokenCookieOptions);
};
