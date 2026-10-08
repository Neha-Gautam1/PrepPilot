import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oop = await prisma.topic.create({ data: { name: 'OOP', slug: 'oop' } });
  const git = await prisma.topic.create({ data: { name: 'Git', slug: 'git' } });
  const aptitude = await prisma.topic.create({ data: { name: 'Aptitude', slug: 'aptitude' } });

  const oopConcepts = await prisma.topic.create({
    data: { name: 'Core Concepts', slug: 'oop-core-concepts', parentId: oop.id },
  });
  const oopDesign = await prisma.topic.create({
    data: { name: 'Design Principles', slug: 'oop-design-principles', parentId: oop.id },
  });
  const gitBasics = await prisma.topic.create({
    data: { name: 'Git Basics', slug: 'git-basics', parentId: git.id },
  });
  const gitBranching = await prisma.topic.create({
    data: { name: 'Branching & Merging', slug: 'git-branching', parentId: git.id },
  });
  const quantAptitude = await prisma.topic.create({
    data: { name: 'Quantitative', slug: 'aptitude-quantitative', parentId: aptitude.id },
  });
  const logicalReasoning = await prisma.topic.create({
    data: { name: 'Logical Reasoning', slug: 'aptitude-logical', parentId: aptitude.id },
  });

  await prisma.question.createMany({
    data: [
      {
        topicId: oopConcepts.id,
        prompt: 'Which OOP concept allows a child class to use methods of a parent class?',
        options: [
          { id: 'a', text: 'Encapsulation' },
          { id: 'b', text: 'Inheritance' },
          { id: 'c', text: 'Polymorphism' },
          { id: 'd', text: 'Abstraction' },
        ],
        correctOptionId: 'b',
        explanation: 'Inheritance lets a subclass reuse and extend the behavior of a parent class.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: oopConcepts.id,
        prompt: 'What is method overriding an example of?',
        options: [
          { id: 'a', text: 'Compile-time polymorphism' },
          { id: 'b', text: 'Runtime polymorphism' },
          { id: 'c', text: 'Encapsulation' },
          { id: 'd', text: 'Abstraction' },
        ],
        correctOptionId: 'b',
        explanation: 'Overriding resolves which method runs at runtime based on the actual object type.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: oopDesign.id,
        prompt: 'What does the Single Responsibility Principle (SRP) state?',
        options: [
          { id: 'a', text: 'A class should have only one reason to change' },
          { id: 'b', text: 'A class should implement only one interface' },
          { id: 'c', text: 'A class should have only one public method' },
          { id: 'd', text: 'A class should only inherit from one parent' },
        ],
        correctOptionId: 'a',
        explanation: 'SRP means a class should be responsible for a single part of the functionality.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: gitBasics.id,
        prompt: 'Which command stages changes for the next commit?',
        options: [
          { id: 'a', text: 'git commit' },
          { id: 'b', text: 'git add' },
          { id: 'c', text: 'git push' },
          { id: 'd', text: 'git pull' },
        ],
        correctOptionId: 'b',
        explanation: '"git add" stages changes in the working directory to be included in the next commit.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: gitBranching.id,
        prompt: 'What is the key difference between "git merge" and "git rebase"?',
        options: [
          { id: 'a', text: 'Merge rewrites commit history; rebase does not' },
          { id: 'b', text: 'Rebase rewrites commit history onto a new base; merge preserves it with a merge commit' },
          { id: 'c', text: 'They do exactly the same thing' },
          { id: 'd', text: 'Merge only works on remote branches' },
        ],
        correctOptionId: 'b',
        explanation: 'Rebase replays commits onto a new base for a linear history; merge combines histories with a merge commit.',
        difficulty: Difficulty.HARD,
      },
      {
        topicId: quantAptitude.id,
        prompt: 'A train travels 60 km in 45 minutes. What is its speed in km/h?',
        options: [
          { id: 'a', text: '60 km/h' },
          { id: 'b', text: '80 km/h' },
          { id: 'c', text: '75 km/h' },
          { id: 'd', text: '90 km/h' },
        ],
        correctOptionId: 'b',
        explanation: '60 km in 45 min = 60 / 0.75 hours = 80 km/h.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: logicalReasoning.id,
        prompt: 'If all Zips are Zaps, and all Zaps are Zops, then all Zips are definitely:',
        options: [
          { id: 'a', text: 'Zops' },
          { id: 'b', text: 'Not Zops' },
          { id: 'c', text: 'Sometimes Zops' },
          { id: 'd', text: 'Cannot be determined' },
        ],
        correctOptionId: 'a',
        explanation: 'By transitivity: Zip → Zap → Zop, so all Zips must be Zops.',
        difficulty: Difficulty.EASY,
      },
    ],
  });

  console.log('Additional topics (OOP, Git, Aptitude) seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });