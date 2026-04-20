import { Injectable, type OnModuleInit } from "@nestjs/common";
import { type BucketItemStat, Client } from "minio";
import type { Readable } from "node:stream";
import { env } from "../env";
import { AppLogger } from "../logging/app-logger.service";

type UploadObjectInput = {
	key: string;
	body: Buffer | Readable;
	size?: number;
	contentType?: string;
};

type ObjectStreamPayload = {
	stream: Readable;
	contentType?: string;
};

type ObjectBufferPayload = {
	buffer: Buffer;
	contentType?: string;
};

@Injectable()
export class S3Service implements OnModuleInit {
	constructor(private readonly logger: AppLogger) {}

	private readonly bucket = env.S3_BUCKET;

	private readonly client = new Client({
		endPoint: env.S3_ENDPOINT,
		port: env.S3_PORT,
		useSSL: env.S3_USE_SSL,
		accessKey: env.S3_ACCESS_KEY,
		secretKey: env.S3_SECRET_KEY,
	});

	async onModuleInit(): Promise<void> {
		try {
			await this.ensureBucketExists();
			this.logger.log(
				"s3_bucket_ready",
				{
					bucket: this.bucket,
				},
				S3Service.name,
			);
		} catch (error) {
			this.logger.error(
				"s3_bucket_init_failed",
				{
					bucket: this.bucket,
					errorMessage: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				},
				S3Service.name,
			);
			throw error;
		}
	}

	async ensureBucketExists(): Promise<void> {
		const bucketExists = await this.client.bucketExists(this.bucket);
		if (!bucketExists) {
			await this.client.makeBucket(this.bucket);
		}
	}

	async getObjectStream(key: string): Promise<ObjectStreamPayload> {
		try {
			const [stream, stat] = await Promise.all([
				this.client.getObject(this.bucket, key),
				this.client.statObject(this.bucket, key),
			]);

			return {
				stream,
				contentType: this.getContentType(stat),
			};
		} catch (error) {
			this.logger.warn(
				"s3_get_object_failed",
				{
					bucket: this.bucket,
					errorMessage: error instanceof Error ? error.message : String(error),
					key,
				},
				S3Service.name,
			);
			throw error;
		}
	}

	async getObjectBuffer(key: string): Promise<ObjectBufferPayload> {
		const { stream, contentType } = await this.getObjectStream(key);
		const chunks: Buffer[] = [];

		for await (const chunk of stream) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}

		return {
			buffer: Buffer.concat(chunks),
			contentType,
		};
	}

	async uploadObject({
		key,
		body,
		size,
		contentType,
	}: UploadObjectInput): Promise<void> {
		try {
			await this.ensureBucketExists();
			const metadata = contentType ? { "Content-Type": contentType } : undefined;
			const objectSize = Buffer.isBuffer(body) ? body.length : size;

			await this.client.putObject(this.bucket, key, body, objectSize, metadata);
		} catch (error) {
			this.logger.error(
				"s3_upload_failed",
				{
					bucket: this.bucket,
					contentType,
					errorMessage: error instanceof Error ? error.message : String(error),
					key,
					size: Buffer.isBuffer(body) ? body.length : size,
					stack: error instanceof Error ? error.stack : undefined,
				},
				S3Service.name,
			);
			throw error;
		}
	}

	async createFolder(path: string): Promise<void> {
		await this.ensureBucketExists();
		const folderKey = path.endsWith("/") ? path : `${path}/`;
		await this.client.putObject(this.bucket, folderKey, Buffer.alloc(0), 0);
	}

	async deleteObject(key: string): Promise<void> {
		await this.client.removeObject(this.bucket, key);
	}

	private getContentType(stat: BucketItemStat): string | undefined {
		return stat.metaData?.["content-type"];
	}
}
