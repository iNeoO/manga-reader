import type { Prisma, User } from "@manga-reader/db";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "..//services/prisma.service";

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	getUsers() {
		return this.prisma.user.findMany({
			select: {
				id: true,
				email: true,
				username: true,
				createdAt: true,
				lastLoginOn: true,
			},
		});
	}

	async getUser(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
		return this.prisma.user.findUnique({
			where: userWhereUniqueInput,
		});
	}

	getUserByEmail(email: string): Promise<User | null> {
		console.log(email);
		return this.prisma.user.findUnique({
			where: { email },
		});
	}
}
