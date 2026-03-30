import { prisma, type PrismaClient } from '@manga-reader/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  readonly client: PrismaClient = prisma;

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
