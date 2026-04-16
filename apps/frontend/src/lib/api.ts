import got from "got";
import { getAuthToken } from "./auth";

export const api = got.extend({
	hooks: {
		beforeRequest: [
			(options) => {
				const token = getAuthToken();
				if (!token) {
					delete options.headers.authorization;
					return;
				}

				options.headers.authorization = `Bearer ${token}`;
			},
		],
	},
});
