import { Injectable } from "@nestjs/common";
import { type BucketItemStat, Client } from "minio";
import type { Readable } from "node:stream";
import { env } from "../env";

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
export class S3Service {
	private readonly bucket = env.S3_BUCKET;

	private readonly client = new Client({
		endPoint: env.S3_ENDPOINT,
		port: env.S3_PORT,
		useSSL: env.S3_USE_SSL,
		accessKey: env.S3_ACCESS_KEY,
		secretKey: env.S3_SECRET_KEY,
	});

	async getObjectStream(key: string): Promise<ObjectStreamPayload> {
		const [stream, stat] = await Promise.all([
			this.client.getObject(this.bucket, key),
			this.client.statObject(this.bucket, key),
		]);

		return {
			stream,
			contentType: this.getContentType(stat),
		};
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
		const metadata = contentType ? { "Content-Type": contentType } : undefined;
		const objectSize = Buffer.isBuffer(body) ? body.length : size;

		await this.client.putObject(this.bucket, key, body, objectSize, metadata);
	}

	async createFolder(path: string): Promise<void> {
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
