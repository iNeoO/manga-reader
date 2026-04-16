import {
	Controller,
	Get,
	Header,
	NotFoundException,
	Param,
	StreamableFile,
	UseGuards,
} from "@nestjs/common";
import sharp from "sharp";
import { AuthGuard } from "../auth/auth.guard";
import { S3Service } from "../s3/s3.service";
import { PagesService } from "./pages.service";

@Controller("pages")
export class PagesController {
	constructor(
		private pagesService: PagesService,
		private s3Service: S3Service,
	) {}

	@UseGuards(AuthGuard)
	@Get(":id")
	async findOne(@Param("id") id: string): Promise<StreamableFile> {
		const { objectKey } = await this.pagesService.getPageStoragePayload({ id });

		try {
			const { stream, contentType } =
				await this.s3Service.getObjectStream(objectKey);

			return new StreamableFile(stream, {
				type: contentType,
			});
		} catch (error) {
			throw new NotFoundException("Image not found.");
		}
	}

	@Header("Content-Type", "image/png")
	@Get(":id/minified")
	async findOneMinified(@Param("id") id: string) {
		const { objectKey } = await this.pagesService.getPageStoragePayload({ id });

		try {
			const { buffer } = await this.s3Service.getObjectBuffer(objectKey);

			const file = await sharp(buffer, { failOnError: false })
				.resize(50)
				.png()
				.toBuffer();
			return file;
		} catch (error) {
			throw new NotFoundException("Image not found.");
		}
	}
}
