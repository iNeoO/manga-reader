import { prisma } from "@manga-reader/db";
import { Client } from "minio";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

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
	rootPath: string;
	chapters: ChapterManifest[];
};

type CreatedPage = {
	id: string;
	objectKey: string;
	filePath: string;
};

const [, , directoryArg] = process.argv;

const printUsageAndExit = (): never => {
	console.error("Usage: pnpm upload:manga-dir -- <directory>");
	process.exit(1);
};

if (!directoryArg) {
	printUsageAndExit();
}

const {
	S3_ENDPOINT,
	S3_PORT,
	S3_USE_SSL,
	S3_ACCESS_KEY,
	S3_SECRET_KEY,
	S3_BUCKET,
} = process.env;

if (
	!S3_ENDPOINT ||
	!S3_PORT ||
	!S3_USE_SSL ||
	!S3_ACCESS_KEY ||
	!S3_SECRET_KEY ||
	!S3_BUCKET
) {
	console.error("Missing S3 environment variables.");
	process.exit(1);
}

const s3Client = new Client({
	endPoint: S3_ENDPOINT,
	port: Number.parseInt(S3_PORT, 10),
	useSSL: S3_USE_SSL === "true",
	accessKey: S3_ACCESS_KEY,
	secretKey: S3_SECRET_KEY,
});

const isJpeg = (fileName: string): boolean => {
	const lowerFileName = fileName.toLowerCase();
	return lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg");
};

const extractChapterNumber = (chapterName: string): number => {
	const match = chapterName.match(/\d+/);
	if (!match) {
		console.error(`Chapter "${chapterName}" must contain a numeric identifier.`);
		process.exit(1);
	}

	return Number.parseInt(match[0], 10);
};

const buildManifest = async (directoryPath: string): Promise<MangaManifest> => {
	const rootPath = resolve(directoryPath);
	const rootStat = await stat(rootPath).catch(() => null);

	if (!rootStat || !rootStat.isDirectory()) {
		console.error(`Directory "${directoryPath}" not found.`);
		process.exit(1);
	}

	const mangaName = basename(rootPath);
	if (!mangaName) {
		console.error("Unable to resolve manga name from directory.");
		process.exit(1);
	}

	const rootEntries = await readdir(rootPath, { withFileTypes: true });
	const chapterDirs = rootEntries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right));

	const unexpectedRootFiles = rootEntries.filter((entry) => entry.isFile());
	if (unexpectedRootFiles.length > 0) {
		console.error("Root directory must only contain chapter folders.");
		process.exit(1);
	}

	if (chapterDirs.length === 0) {
		console.error("Directory must contain at least one chapter folder.");
		process.exit(1);
	}

	const chapters = await Promise.all(
		chapterDirs.map(async (chapterName) => {
			const chapterPath = join(rootPath, chapterName);
			const chapterEntries = await readdir(chapterPath, { withFileTypes: true });
			const nestedDirectories = chapterEntries.filter((entry) => entry.isDirectory());
			if (nestedDirectories.length > 0) {
				console.error(`Chapter "${chapterName}" contains nested directories.`);
				process.exit(1);
			}

			const imageFiles = chapterEntries
				.filter((entry) => entry.isFile())
				.map((entry) => entry.name);

			if (imageFiles.length === 0) {
				console.error(`Chapter "${chapterName}" must contain at least one JPG image.`);
				process.exit(1);
			}

			const invalidFiles = imageFiles.filter((fileName) => !isJpeg(fileName));
			if (invalidFiles.length > 0) {
				console.error(
					`Chapter "${chapterName}" contains non-JPG files: ${invalidFiles.join(", ")}`,
				);
				process.exit(1);
			}

			return {
				name: chapterName,
				number: extractChapterNumber(chapterName),
				pages: imageFiles
					.sort((left, right) => left.localeCompare(right))
					.map((fileName, index) => ({
						fileName,
						filePath: join(chapterPath, fileName),
						number: index + 1,
					})),
			};
		}),
	);

	const chapterNames = new Set<string>();
	const chapterNumbers = new Set<number>();
	for (const chapter of chapters) {
		if (chapterNames.has(chapter.name)) {
			console.error(`Duplicate chapter name "${chapter.name}".`);
			process.exit(1);
		}
		if (chapterNumbers.has(chapter.number)) {
			console.error(`Duplicate chapter number "${chapter.number}".`);
			process.exit(1);
		}
		chapterNames.add(chapter.name);
		chapterNumbers.add(chapter.number);
	}

	return {
		name: mangaName,
		rootPath,
		chapters: chapters.sort((left, right) => left.number - right.number),
	};
};

const createRecords = async (manifest: MangaManifest) => {
	return prisma.$transaction(async (tx) => {
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
};

const cleanupUploadedObjects = async (keys: string[]) => {
	for (const key of keys.reverse()) {
		try {
			await s3Client.removeObject(S3_BUCKET, key);
		} catch {}
	}
};

const cleanupDatabase = async (mangaId: string) => {
	await prisma.$transaction(async (tx) => {
		const chapters = await tx.chapter.findMany({
			where: {
				mangaId,
			},
			select: {
				id: true,
			},
		});

		const chapterIds = chapters.map((chapter) => chapter.id);

		await tx.manga.updateMany({
			where: {
				id: mangaId,
			},
			data: {
				coverPageId: null,
			},
		});

		if (chapterIds.length > 0) {
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

			await tx.chapterRead.deleteMany({
				where: {
					chapterId: {
						in: chapterIds,
					},
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
};

try {
	const manifest = await buildManifest(directoryArg);

	const existingManga = await prisma.manga.findUnique({
		where: {
			name: manifest.name,
		},
	});

	if (existingManga) {
		console.error(`Manga "${manifest.name}" already exists.`);
		process.exit(1);
	}

	const created = await createRecords(manifest);
	const uploadedKeys: string[] = [];

	try {
		await s3Client.putObject(S3_BUCKET, `${created.mangaId}/`, Buffer.alloc(0), 0);

		for (const page of created.pages) {
			const body = await readFile(page.filePath);
			await s3Client.putObject(
				S3_BUCKET,
				page.objectKey,
				body,
				body.length,
				{ "Content-Type": "image/jpeg" },
			);
			uploadedKeys.push(page.objectKey);
		}
	} catch (error) {
		await cleanupUploadedObjects(uploadedKeys);
		await cleanupDatabase(created.mangaId);
		console.error("Manga upload failed.");
		throw error;
	}

	console.log(
		JSON.stringify(
			{
				uploaded: true,
				manga: {
					id: created.mangaId,
					name: manifest.name,
				},
				chapters: manifest.chapters.length,
				pages: created.pages.length,
			},
			null,
			2,
		),
	);
} finally {
	await prisma.$disconnect();
}
