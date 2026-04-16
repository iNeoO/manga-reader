import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import type { MultipartFile } from "@fastify/multipart";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, normalize, relative, sep } from "node:path";
import unzipper from "unzipper";
import { PrismaService } from "../services/prisma.service";
import { S3Service } from "../s3/s3.service";

type ZipEntry = {
	path: string;
	type: "File" | "Directory";
	buffer?: Buffer;
};

type ZipFileEntry = ZipEntry & {
	type: "File";
	buffer: Buffer;
};

type PageManifest = {
	fileName: string;
	filePath: string;
	number: number;
};

type ChapterManifest = {
	name: string;
	number: number;
	pages: PageManifest[];
};

type MangaManifest = {
	name: string;
	chapters: ChapterManifest[];
};

type CreatedPage = {
	id: string;
	objectKey: string;
	filePath: string;
};

@Injectable()
export class MangaImportService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly s3Service: S3Service,
	) {}

	async importZip(file: MultipartFile) {
		this.validateFile(file);

		const tempDir = await mkdtemp(join(tmpdir(), "manga-import-"));

		try {
			const zipBuffer = await file.toBuffer();
			const entries = await this.readZipEntries(zipBuffer);
			const manifest = await this.extractAndBuildManifest(entries, tempDir);
			await this.ensureNoConflicts(manifest);

			const created = await this.createRecords(manifest);
			const uploadedKeys: string[] = [];

			try {
				await this.s3Service.createFolder(created.mangaId);

				for (const page of created.pages) {
					const body = await readFile(page.filePath);
					await this.s3Service.uploadObject({
						key: page.objectKey,
						body,
						contentType: "image/jpeg",
					});
					uploadedKeys.push(page.objectKey);
				}
			} catch (error) {
				await this.cleanupUploadedObjects(uploadedKeys);
				await this.cleanupDatabase(created.mangaId);
				throw new InternalServerErrorException("Manga import failed.");
			}

			return {
				mangaId: created.mangaId,
				chapterCount: manifest.chapters.length,
				pageCount: created.pages.length,
			};
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	}

	private validateFile(file: MultipartFile) {
		const fileName = file.filename.toLowerCase();
		if (!fileName.endsWith(".zip")) {
			throw new BadRequestException("Uploaded file must be a ZIP archive.");
		}
	}

	private async readZipEntries(zipBuffer: Buffer): Promise<ZipEntry[]> {
		try {
			const directory = await unzipper.Open.buffer(zipBuffer);
			return await Promise.all(
				directory.files.map(async (entry) => {
					if (entry.type === "Directory") {
						return {
							path: entry.path,
							type: "Directory" as const,
						};
					}

					return {
						path: entry.path,
						type: "File" as const,
						buffer: await entry.buffer(),
					};
				}),
			);
		} catch {
			throw new BadRequestException("Invalid ZIP archive.");
		}
	}

	private async extractAndBuildManifest(
		entries: ZipEntry[],
		tempDir: string,
	): Promise<MangaManifest> {
		const normalizedEntries = entries.map((entry) => ({
			...entry,
			path: this.normalizeEntryPath(entry.path),
		}));

		const fileEntries = normalizedEntries.filter(
			(entry): entry is ZipFileEntry => entry.type === "File",
		);

		if (fileEntries.length === 0) {
			throw new BadRequestException("ZIP archive is empty.");
		}

		const filteredEntries = fileEntries.filter(
			(entry) => !entry.path.startsWith("__MACOSX/"),
		);
		const filteredDirectories = normalizedEntries.filter(
			(entry) =>
				entry.type === "Directory" && !entry.path.startsWith("__MACOSX/"),
		);

		if (filteredEntries.length === 0) {
			throw new BadRequestException("ZIP archive is empty.");
		}

		const rootNames = new Set(filteredEntries.map((entry) => entry.path.split("/")[0]));
		if (rootNames.size !== 1) {
			throw new BadRequestException(
				"ZIP archive must contain exactly one root folder.",
			);
		}

		const mangaName = [...rootNames][0];
		const declaredChapterNames = new Set(
			filteredDirectories
				.map((entry) => entry.path.split("/"))
				.filter((segments) => segments.length === 2 && segments[0] === mangaName)
				.map((segments) => segments[1]),
		);
		const chaptersByName = new Map<string, ChapterManifest>();

		for (const entry of filteredEntries) {
			const segments = entry.path.split("/");
			if (segments.length !== 3) {
				throw new BadRequestException(
					"ZIP structure must be manga/tome/image.jpg.",
				);
			}

			const [rootName, chapterName, fileName] = segments;
			if (rootName !== mangaName) {
				throw new BadRequestException(
					"ZIP archive must contain exactly one root folder.",
				);
			}

			if (!this.isJpeg(fileName)) {
				throw new BadRequestException("Only JPG/JPEG files are allowed.");
			}

			let chapter = chaptersByName.get(chapterName);
			if (!chapter) {
				chapter = {
					name: chapterName,
					number: this.extractChapterNumber(chapterName),
					pages: [],
				};
				chaptersByName.set(chapterName, chapter);
			}

			const destinationPath = this.resolveExtractionPath(tempDir, entry.path);
			await mkdir(dirname(destinationPath), { recursive: true });
			await writeFile(destinationPath, entry.buffer);
			chapter.pages.push({
				fileName,
				filePath: destinationPath,
				number: 0,
			});
		}

		if (chaptersByName.size === 0) {
			throw new BadRequestException(
				"ZIP archive must contain at least one chapter folder.",
			);
		}

		for (const chapterName of declaredChapterNames) {
			if (!chaptersByName.has(chapterName)) {
				throw new BadRequestException(
					`Chapter "${chapterName}" must contain at least one JPG image.`,
				);
			}
		}

		const chapters = [...chaptersByName.values()]
			.map((chapter) => ({
				...chapter,
				pages: [...chapter.pages]
					.sort((left, right) => left.fileName.localeCompare(right.fileName))
					.map((page, index) => ({
						...page,
						number: index + 1,
					})),
			}))
			.sort((left, right) => left.number - right.number);

		for (const chapter of chapters) {
			if (chapter.pages.length === 0) {
				throw new BadRequestException("Each chapter must contain one JPG image.");
			}
		}

		this.ensureUniqueChapterFields(chapters);

		return {
			name: mangaName,
			chapters,
		};
	}

	private normalizeEntryPath(entryPath: string): string {
		const normalizedPath = normalize(entryPath.replaceAll("\\", "/")).replaceAll(
			"\\",
			"/",
		);

		if (
			normalizedPath.startsWith("/") ||
			normalizedPath.startsWith("../") ||
			normalizedPath.includes("/../")
		) {
			throw new BadRequestException("ZIP archive contains unsafe paths.");
		}

		return normalizedPath.replace(/\/+/g, "/").replace(/\/$/, "");
	}

	private resolveExtractionPath(tempDir: string, entryPath: string): string {
		const destinationPath = join(tempDir, entryPath);
		const relativePath = relative(tempDir, destinationPath);
		if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
			throw new BadRequestException("ZIP archive contains unsafe paths.");
		}

		return destinationPath;
	}

	private isJpeg(fileName: string): boolean {
		const lowerFileName = fileName.toLowerCase();
		return lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg");
	}

	private extractChapterNumber(chapterName: string): number {
		const match = chapterName.match(/\d+/);
		if (!match) {
			throw new BadRequestException(
				`Chapter "${chapterName}" must contain a numeric identifier.`,
			);
		}

		return Number.parseInt(match[0], 10);
	}

	private ensureUniqueChapterFields(chapters: ChapterManifest[]) {
		const chapterNames = new Set<string>();
		const chapterNumbers = new Set<number>();

		for (const chapter of chapters) {
			if (chapterNames.has(chapter.name)) {
				throw new BadRequestException(
					`Duplicate chapter name "${chapter.name}" in ZIP archive.`,
				);
			}
			if (chapterNumbers.has(chapter.number)) {
				throw new BadRequestException(
					`Duplicate chapter number "${chapter.number}" in ZIP archive.`,
				);
			}

			chapterNames.add(chapter.name);
			chapterNumbers.add(chapter.number);
		}
	}

	private async ensureNoConflicts(manifest: MangaManifest) {
		const existingManga = await this.prisma.client.manga.findUnique({
			where: {
				name: manifest.name,
			},
		});

		if (existingManga) {
			throw new ConflictException("Manga already exists.");
		}
	}

	private async createRecords(manifest: MangaManifest) {
		return this.prisma.client.$transaction(async (tx) => {
			const manga = await tx.manga.create({
				data: {
					name: manifest.name,
				},
			});

			const pages: CreatedPage[] = [];
			let mangaCoverPageId: string | null = null;

			for (const chapterManifest of manifest.chapters) {
				const chapter = await tx.chapter.create({
					data: {
						name: chapterManifest.name,
						number: chapterManifest.number,
						mangaId: manga.id,
					},
				});

				let chapterCoverPageId: string | null = null;

				for (const pageManifest of chapterManifest.pages) {
					const page = await tx.page.create({
						data: {
							name: pageManifest.fileName,
							number: pageManifest.number,
							chapterId: chapter.id,
							path: `${manga.id}/pending`,
						},
					});

					const objectKey = `${manga.id}/${page.id}`;
					const updatedPage = await tx.page.update({
						where: {
							id: page.id,
						},
						data: {
							path: objectKey,
						},
					});

					if (!chapterCoverPageId) {
						chapterCoverPageId = updatedPage.id;
					}
					if (!mangaCoverPageId) {
						mangaCoverPageId = updatedPage.id;
					}

					pages.push({
						id: updatedPage.id,
						objectKey,
						filePath: pageManifest.filePath,
					});
				}

				await tx.chapter.update({
					where: {
						id: chapter.id,
					},
					data: {
						coverPageId: chapterCoverPageId,
					},
				});
			}

			await tx.manga.update({
				where: {
					id: manga.id,
				},
				data: {
					coverPageId: mangaCoverPageId,
				},
			});

			return {
				mangaId: manga.id,
				pages,
			};
		});
	}

	private async cleanupUploadedObjects(uploadedKeys: string[]) {
		for (const key of uploadedKeys.reverse()) {
			try {
				await this.s3Service.deleteObject(key);
			} catch {}
		}
	}

	private async cleanupDatabase(mangaId: string) {
		await this.prisma.client.$transaction(async (tx) => {
			const chapters = await tx.chapter.findMany({
				where: {
					mangaId,
				},
				select: {
					id: true,
				},
			});

			const chapterIds = chapters.map((chapter) => chapter.id);

			if (chapterIds.length > 0) {
				await tx.manga.updateMany({
					where: {
						id: mangaId,
					},
					data: {
						coverPageId: null,
					},
				});

				await tx.chapter.updateMany({
					where: {
						id: {
							in: chapterIds,
						},
					},
					data: {
						coverPageId: null,
					},
				});

				await tx.page.deleteMany({
					where: {
						chapterId: {
							in: chapterIds,
						},
					},
				});

				await tx.chapter.deleteMany({
					where: {
						id: {
							in: chapterIds,
						},
					},
				});
			}

			await tx.manga.deleteMany({
				where: {
					id: mangaId,
				},
			});
		});
	}
}
