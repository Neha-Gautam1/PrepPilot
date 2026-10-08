import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arraysTopic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'dsa-arrays' } });

  await prisma.dsaProblem.createMany({
    data: [
      {
        topicId: arraysTopic.id,
        prompt: 'Write a function that returns the sum of all numbers in an array.',
        functionName: 'sumArray',
        starterCode: 'function sumArray(arr) {\n  // your code here\n}',
        testCases: [
          { input: [[1, 2, 3]], expectedOutput: 6 },
          { input: [[]], expectedOutput: 0 },
          { input: [[-5, 5, 10]], expectedOutput: 10 },
        ],
        difficulty: Difficulty.EASY,
      },
      {
        topicId: arraysTopic.id,
        prompt: 'Write a function that returns the largest number in an array.',
        functionName: 'findMax',
        starterCode: 'function findMax(arr) {\n  // your code here\n}',
        testCases: [
          { input: [[3, 7, 2]], expectedOutput: 7 },
          { input: [[-10, -3, -50]], expectedOutput: -3 },
          { input: [[42]], expectedOutput: 42 },
        ],
        difficulty: Difficulty.MEDIUM,
      },
    ],
  });

  console.log('DSA problems seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });