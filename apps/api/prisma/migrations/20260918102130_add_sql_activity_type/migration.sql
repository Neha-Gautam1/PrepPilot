-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'SQL';

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "executionError" TEXT,
ADD COLUMN     "sqlExerciseId" TEXT,
ADD COLUMN     "submittedQuery" TEXT,
ALTER COLUMN "questionId" DROP NOT NULL,
ALTER COLUMN "selectedOptionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SqlExercise" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "canonicalQuery" TEXT NOT NULL,
    "expectedResultJson" JSONB NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SqlExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SqlExercise_topicId_idx" ON "SqlExercise"("topicId");

-- CreateIndex
CREATE INDEX "Attempt_sqlExerciseId_idx" ON "Attempt"("sqlExerciseId");

-- AddForeignKey
ALTER TABLE "SqlExercise" ADD CONSTRAINT "SqlExercise_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_sqlExerciseId_fkey" FOREIGN KEY ("sqlExerciseId") REFERENCES "SqlExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
