import { z } from "zod";

const envSchema = z.object({
	JWT_SECRET: z.string(),
	PG_URL: z.string(),
	VITE_COOKIE_TOKEN_DURATION: z.coerce.number().positive(),
	S3_ENDPOINT: z.string(),
	S3_PORT: z.coerce.number().int().positive(),
	S3_USE_SSL: z
		.string()
		.transform((value) => value === "true"),
	S3_ACCESS_KEY: z.string(),
	S3_SECRET_KEY: z.string(),
	S3_BUCKET: z.string(),
});

export const env = envSchema.parse(process.env);
