-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "mangaId" TEXT NOT NULL,
    "coverPageId" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manga" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coverPageId" TEXT,

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginOn" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterRead" (
    "isRead" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "lastPageReadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterRead_pkey" PRIMARY KEY ("userId","chapterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_chapterId_number_key" ON "Page"("chapterId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Page_chapterId_name_key" ON "Page"("chapterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_coverPageId_key" ON "Chapter"("coverPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_mangaId_name_key" ON "Chapter"("mangaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_mangaId_number_key" ON "Chapter"("mangaId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_name_key" ON "Manga"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_coverPageId_key" ON "Manga"("coverPageId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_coverPageId_fkey" FOREIGN KEY ("coverPageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manga" ADD CONSTRAINT "Manga_coverPageId_fkey" FOREIGN KEY ("coverPageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRead" ADD CONSTRAINT "ChapterRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRead" ADD CONSTRAINT "ChapterRead_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRead" ADD CONSTRAINT "ChapterRead_lastPageReadId_fkey" FOREIGN KEY ("lastPageReadId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
