import type { Prisma } from "@manga-reader/db";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "..//services/prisma.service";

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	getUsers() {
		return this.prisma.client.user.findMany({
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
		const user = await this.prisma.client.user.findUnique({
			where: userWhereUniqueInput,
		});

		return user;
	}
}
