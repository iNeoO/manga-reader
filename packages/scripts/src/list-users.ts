import { prisma } from "@manga-reader/db";

try {
	const users = await prisma.user.findMany({
		select: {
			id: true,
			email: true,
			username: true,
			createdAt: true,
			lastLoginOn: true,
		},
		orderBy: {
			email: "asc",
		},
	});

	console.table(
		users.map((user) => ({
			id: user.id,
			email: user.email,
			username: user.username,
			createdAt: user.createdAt.toISOString(),
			lastLoginOn: user.lastLoginOn?.toISOString() ?? "-",
		})),
	);
} finally {
	await prisma.$disconnect();
}
