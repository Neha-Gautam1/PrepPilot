-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'HR');

-- AlterTable
ALTER TABLE "MockInterviewSession" ADD COLUMN     "type" "InterviewType" NOT NULL DEFAULT 'TECHNICAL',
ALTER COLUMN "topicId" DROP NOT NULL;
