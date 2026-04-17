import Cookies from "js-cookie";

const env = import.meta.env as Record<string, string | undefined>;

export const tokenCookieName = env.VITE_COOKIE_TOKEN_NAME ?? "access_token";

export const tokenCookieDuration = Number(env.VITE_COOKIE_TOKEN_DURATION ?? 1);

export const getAuthToken = () => {
	const token = Cookies.get(tokenCookieName);
	if (token) {
		return `Bearer ${token}`;
	}
	return;
};

export const setAuthToken = (token: string) => {
	Cookies.set(tokenCookieName, token, {
		expires: tokenCookieDuration,
		secure: true,
	});
};

export const clearAuthToken = () => {
	Cookies.remove(tokenCookieName);
};
