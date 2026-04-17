import { PrismaClient } from "@manga-reader/db";
import { Injectable } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.PG_URL,
    });
    super({ adapter });
  }
}