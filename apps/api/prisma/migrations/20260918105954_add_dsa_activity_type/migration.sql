-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'DSA';

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "dsaProblemId" TEXT,
ADD COLUMN     "hintsUsed" INTEGER DEFAULT 0,
ADD COLUMN     "submittedCode" TEXT,
ADD COLUMN     "testsPassed" INTEGER,
ADD COLUMN     "testsTotal" INTEGER;

-- CreateTable
CREATE TABLE "DsaProblem" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "testCases" JSONB NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DsaProblem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DsaProblem_topicId_idx" ON "DsaProblem"("topicId");

-- CreateIndex
CREATE INDEX "Attempt_dsaProblemId_idx" ON "Attempt"("dsaProblemId");

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_dsaProblemId_fkey" FOREIGN KEY ("dsaProblemId") REFERENCES "DsaProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DsaProblem" ADD CONSTRAINT "DsaProblem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
