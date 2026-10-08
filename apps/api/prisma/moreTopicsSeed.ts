import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const os = await prisma.topic.create({ data: { name: 'Operating Systems', slug: 'os' } });
  const dbms = await prisma.topic.create({ data: { name: 'DBMS', slug: 'dbms' } });
  const cn = await prisma.topic.create({ data: { name: 'Computer Networks', slug: 'cn' } });

  const processMgmt = await prisma.topic.create({
    data: { name: 'Process Management', slug: 'os-process-management', parentId: os.id },
  });
  const memoryMgmt = await prisma.topic.create({
    data: { name: 'Memory Management', slug: 'os-memory-management', parentId: os.id },
  });
  const normalization = await prisma.topic.create({
    data: { name: 'Normalization', slug: 'dbms-normalization', parentId: dbms.id },
  });
  const transactions = await prisma.topic.create({
    data: { name: 'Transactions', slug: 'dbms-transactions', parentId: dbms.id },
  });
  const osiModel = await prisma.topic.create({
    data: { name: 'OSI Model', slug: 'cn-osi-model', parentId: cn.id },
  });
  const tcpIp = await prisma.topic.create({
    data: { name: 'TCP/IP', slug: 'cn-tcp-ip', parentId: cn.id },
  });

  await prisma.question.createMany({
    data: [
      {
        topicId: processMgmt.id,
        prompt: 'What is a process in an operating system?',
        options: [
          { id: 'a', text: 'A program in execution' },
          { id: 'b', text: 'A file stored on disk' },
          { id: 'c', text: 'A hardware device' },
          { id: 'd', text: 'A type of memory' },
        ],
        correctOptionId: 'a',
        explanation: 'A process is a program in execution, including its current activity and resources.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: processMgmt.id,
        prompt: 'Which scheduling algorithm can cause starvation?',
        options: [
          { id: 'a', text: 'Round Robin' },
          { id: 'b', text: 'Priority Scheduling' },
          { id: 'c', text: 'FCFS' },
          { id: 'd', text: 'None of these' },
        ],
        correctOptionId: 'b',
        explanation: 'Priority scheduling can starve low-priority processes if high-priority ones keep arriving.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: memoryMgmt.id,
        prompt: 'What is thrashing in the context of memory management?',
        options: [
          { id: 'a', text: 'Excessive paging causing low CPU utilization' },
          { id: 'b', text: 'A type of memory leak' },
          { id: 'c', text: 'A CPU scheduling technique' },
          { id: 'd', text: 'A disk formatting process' },
        ],
        correctOptionId: 'a',
        explanation: 'Thrashing occurs when the system spends more time paging than executing processes.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: normalization.id,
        prompt: 'What does 1NF (First Normal Form) require?',
        options: [
          { id: 'a', text: 'Atomic column values, no repeating groups' },
          { id: 'b', text: 'No transitive dependencies' },
          { id: 'c', text: 'No partial dependencies' },
          { id: 'd', text: 'All foreign keys must be unique' },
        ],
        correctOptionId: 'a',
        explanation: '1NF requires that each column hold atomic (indivisible) values with no repeating groups.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: transactions.id,
        prompt: 'What does the "I" in ACID stand for?',
        options: [
          { id: 'a', text: 'Integrity' },
          { id: 'b', text: 'Isolation' },
          { id: 'c', text: 'Indexing' },
          { id: 'd', text: 'Inheritance' },
        ],
        correctOptionId: 'b',
        explanation: 'Isolation ensures concurrent transactions don\'t interfere with each other\'s intermediate state.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: osiModel.id,
        prompt: 'Which OSI layer is responsible for routing?',
        options: [
          { id: 'a', text: 'Data Link Layer' },
          { id: 'b', text: 'Network Layer' },
          { id: 'c', text: 'Transport Layer' },
          { id: 'd', text: 'Session Layer' },
        ],
        correctOptionId: 'b',
        explanation: 'The Network Layer (Layer 3) handles logical addressing and routing between networks.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: tcpIp.id,
        prompt: 'What does TCP guarantee that UDP does not?',
        options: [
          { id: 'a', text: 'Faster transmission' },
          { id: 'b', text: 'Reliable, ordered delivery' },
          { id: 'c', text: 'Lower latency' },
          { id: 'd', text: 'Broadcast support' },
        ],
        correctOptionId: 'b',
        explanation: 'TCP provides reliable, ordered, error-checked delivery; UDP does not guarantee any of this.',
        difficulty: Difficulty.EASY,
      },
    ],
  });

  console.log('Additional topics (OS, DBMS, Computer Networks) seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });