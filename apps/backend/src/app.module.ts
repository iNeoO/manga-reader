import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ChapterModule } from "./chapters/chapters.module";
import { ChaptersReadModule } from "./chaptersRead/chaptersRead.module";
import { LoggingModule } from "./logging/logging.module";
import { MetricsModule } from "./metrics/metrics.module";
import { MangasModule } from "./mangas/mangas.module";
import { PagesModule } from "./pages/pages.module";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [
		LoggingModule,
		MetricsModule,
		AuthModule,
		UsersModule,
		ChapterModule,
		ChaptersReadModule,
		PagesModule,
		MangasModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
