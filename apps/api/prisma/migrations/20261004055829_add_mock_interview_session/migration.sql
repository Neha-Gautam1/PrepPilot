-- CreateTable
CREATE TABLE "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "transcript" JSONB NOT NULL,
    "technicalAccuracy" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "overallFeedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_idx" ON "MockInterviewSession"("userId");

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
