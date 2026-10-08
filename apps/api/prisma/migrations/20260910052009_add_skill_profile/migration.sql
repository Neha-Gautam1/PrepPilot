-- CreateTable
CREATE TABLE "SkillProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL,
    "totalWeightedAttempts" DOUBLE PRECISION NOT NULL,
    "correctWeightedAttempts" DOUBLE PRECISION NOT NULL,
    "lastPracticedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillProfile_userId_idx" ON "SkillProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProfile_userId_topicId_key" ON "SkillProfile"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "SkillProfile" ADD CONSTRAINT "SkillProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProfile" ADD CONSTRAINT "SkillProfile_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
