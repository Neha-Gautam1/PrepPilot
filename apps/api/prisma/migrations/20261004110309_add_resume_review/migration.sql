-- CreateTable
CREATE TABLE "ResumeReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "jobDescription" TEXT,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeReview_userId_idx" ON "ResumeReview"("userId");

-- AddForeignKey
ALTER TABLE "ResumeReview" ADD CONSTRAINT "ResumeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
