import { prisma } from "@manga-reader/db";
import { Client } from "minio";

const [, , mangaId] = process.argv;

const printUsageAndExit = (): never => {
	console.error("Usage: pnpm delete:manga -- <mangaId>");
	process.exit(1);
};

if (!mangaId) {
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

try {
	const manga = await prisma.manga.findUnique({
		where: {
			id: mangaId,
		},
		select: {
			id: true,
			name: true,
			chapters: {
				select: {
					id: true,
					pages: {
						select: {
							id: true,
							path: true,
						},
					},
				},
			},
		},
	});

	if (!manga) {
		console.error(`Manga with id "${mangaId}" not found.`);
		process.exit(1);
	}

	const chapterIds = manga.chapters.map((chapter) => chapter.id);
	const objectKeys = manga.chapters.flatMap((chapter) =>
		chapter.pages.map((page) => page.path),
	);

	for (const key of objectKeys) {
		try {
			await s3Client.removeObject(S3_BUCKET, key);
		} catch (error) {
			console.error(`Failed to delete S3 object "${key}".`);
			throw error;
		}
	}

	try {
		await s3Client.removeObject(S3_BUCKET, `${manga.id}/`);
	} catch {}

	await prisma.$transaction(async (tx) => {
		await tx.manga.updateMany({
			where: {
				id: manga.id,
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

		await tx.manga.delete({
			where: {
				id: manga.id,
			},
		});
	});

	console.log(
		JSON.stringify(
			{
				deleted: true,
				manga: {
					id: manga.id,
					name: manga.name,
				},
				chapters: manga.chapters.length,
				pages: objectKeys.length,
			},
			null,
			2,
		),
	);
} finally {
	await prisma.$disconnect();
}
