import { IsBoolean, IsNotEmpty } from "class-validator";

export class CreateChapterReadDto {
	@IsNotEmpty()
	chapterId: string;

	@IsNotEmpty()
	lastPageReadId: string;

	@IsBoolean()
	isRead: boolean;
}
