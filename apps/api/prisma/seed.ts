import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Top-level subjects
  const dsa = await prisma.topic.create({
    data: { name: 'DSA', slug: 'dsa' },
  });
  const sql = await prisma.topic.create({
    data: { name: 'SQL', slug: 'sql' },
  });

  // Subtopics under DSA
  const arrays = await prisma.topic.create({
    data: { name: 'Arrays', slug: 'dsa-arrays', parentId: dsa.id },
  });
  const trees = await prisma.topic.create({
    data: { name: 'Trees', slug: 'dsa-trees', parentId: dsa.id },
  });

  // Subtopic under SQL
  const joins = await prisma.topic.create({
    data: { name: 'Joins', slug: 'sql-joins', parentId: sql.id },
  });

  await prisma.question.createMany({
    data: [
      {
        topicId: arrays.id,
        prompt: 'What is the time complexity of accessing an element by index in an array?',
        options: [
          { id: 'a', text: 'O(1)' },
          { id: 'b', text: 'O(n)' },
          { id: 'c', text: 'O(log n)' },
          { id: 'd', text: 'O(n^2)' },
        ],
        correctOptionId: 'a',
        explanation: 'Arrays support constant-time random access via index arithmetic.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: trees.id,
        prompt: 'What is the time complexity of searching in a balanced Binary Search Tree?',
        options: [
          { id: 'a', text: 'O(1)' },
          { id: 'b', text: 'O(n)' },
          { id: 'c', text: 'O(log n)' },
          { id: 'd', text: 'O(n log n)' },
        ],
        correctOptionId: 'c',
        explanation: 'A balanced BST halves the search space at each step.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: joins.id,
        prompt: 'Which JOIN returns all rows from the left table, and matched rows from the right table?',
        options: [
          { id: 'a', text: 'INNER JOIN' },
          { id: 'b', text: 'LEFT JOIN' },
          { id: 'c', text: 'RIGHT JOIN' },
          { id: 'd', text: 'FULL OUTER JOIN' },
        ],
        correctOptionId: 'b',
        explanation: 'LEFT JOIN preserves all left-table rows even without a match.',
        difficulty: Difficulty.EASY,
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });