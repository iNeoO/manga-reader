import argon2 from "argon2";
import { prisma } from "@manga-reader/db";

const [, , email, password] = process.argv;

const printUsageAndExit = (): never => {
	console.error("Usage: pnpm create:user -- <email> <password>");
	process.exit(1);
};

if (!email || !password) {
	printUsageAndExit();
}

const username = email.split("@")[0]?.trim();

if (!username) {
	console.error("Email must contain a valid local part.");
	process.exit(1);
}

try {
	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		console.error(`User with email "${email}" already exists.`);
		process.exit(1);
	}

	const hashedPassword = await argon2.hash(password);

	const user = await prisma.user.create({
		data: {
			email,
			username,
			password: hashedPassword,
		},
		select: {
			id: true,
			email: true,
			username: true,
		},
	});

	console.log(
		JSON.stringify(
			{
				created: true,
				user,
			},
			null,
			2,
		),
	);
} finally {
	await prisma.$disconnect();
}
