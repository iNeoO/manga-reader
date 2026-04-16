import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { MangasModule } from "./mangas/mangas.module";
import { PagesModule } from "./pages/pages.module";

@Module({
	imports: [AuthModule, PagesModule, MangasModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
