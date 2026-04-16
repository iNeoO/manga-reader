import { prisma } from "@manga-reader/db";

try {
	const mangas = await prisma.manga.findMany({
		select: {
			id: true,
			name: true,
			coverPageId: true,
			_count: {
				select: {
					chapters: true,
				},
			},
			chapters: {
				select: {
					_count: {
						select: {
							pages: true,
						},
					},
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	const rows = mangas.map((manga) => ({
		id: manga.id,
		name: manga.name,
		coverPageId: manga.coverPageId ?? "-",
		chapters: manga._count.chapters,
		pages: manga.chapters.reduce(
			(total, chapter) => total + chapter._count.pages,
			0,
		),
	}));

	console.table(rows);
} finally {
	await prisma.$disconnect();
}
