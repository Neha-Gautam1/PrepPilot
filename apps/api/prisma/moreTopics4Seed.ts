import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mongo = await prisma.topic.create({ data: { name: 'MongoDB', slug: 'mongodb' } });
  const sysDesign = await prisma.topic.create({ data: { name: 'System Design', slug: 'system-design' } });
  const aiml = await prisma.topic.create({ data: { name: 'AI/ML Basics', slug: 'aiml-basics' } });

  const mongoDocs = await prisma.topic.create({
    data: { name: 'Documents & Collections', slug: 'mongo-documents', parentId: mongo.id },
  });
  const mongoIndexing = await prisma.topic.create({
    data: { name: 'Indexing', slug: 'mongo-indexing', parentId: mongo.id },
  });
  const sdScalability = await prisma.topic.create({
    data: { name: 'Scalability', slug: 'sd-scalability', parentId: sysDesign.id },
  });
  const sdCaching = await prisma.topic.create({
    data: { name: 'Caching', slug: 'sd-caching', parentId: sysDesign.id },
  });
  const mlSupervised = await prisma.topic.create({
    data: { name: 'Supervised Learning', slug: 'ml-supervised', parentId: aiml.id },
  });
  const mlEvaluation = await prisma.topic.create({
    data: { name: 'Model Evaluation', slug: 'ml-evaluation', parentId: aiml.id },
  });

  await prisma.question.createMany({
    data: [
      {
        topicId: mongoDocs.id,
        prompt: 'What format does MongoDB store documents in?',
        options: [
          { id: 'a', text: 'XML' },
          { id: 'b', text: 'BSON (binary JSON)' },
          { id: 'c', text: 'CSV' },
          { id: 'd', text: 'Plain text' },
        ],
        correctOptionId: 'b',
        explanation: 'MongoDB stores documents as BSON, a binary-encoded extension of JSON.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: mongoIndexing.id,
        prompt: 'What is the main benefit of creating an index on a MongoDB field?',
        options: [
          { id: 'a', text: 'It reduces document size' },
          { id: 'b', text: 'It speeds up queries filtering on that field' },
          { id: 'c', text: 'It encrypts the field' },
          { id: 'd', text: 'It enforces a schema' },
        ],
        correctOptionId: 'b',
        explanation: 'Indexes let MongoDB avoid full collection scans when querying indexed fields.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: sdScalability.id,
        prompt: 'What is the difference between vertical and horizontal scaling?',
        options: [
          { id: 'a', text: 'Vertical adds more machines; horizontal upgrades one machine' },
          { id: 'b', text: 'Vertical upgrades one machine\'s resources; horizontal adds more machines' },
          { id: 'c', text: 'They are the same thing' },
          { id: 'd', text: 'Horizontal only applies to databases' },
        ],
        correctOptionId: 'b',
        explanation: 'Vertical scaling = bigger machine; horizontal scaling = more machines sharing load.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: sdCaching.id,
        prompt: 'What is a cache-aside (lazy loading) strategy?',
        options: [
          { id: 'a', text: 'Data is always written to cache first, then the database' },
          { id: 'b', text: 'The application loads data into cache only when it\'s requested and missing' },
          { id: 'c', text: 'The cache is refreshed on a fixed schedule regardless of use' },
          { id: 'd', text: 'Caching is disabled' },
        ],
        correctOptionId: 'b',
        explanation: 'Cache-aside loads data into the cache on a miss, rather than pre-populating it.',
        difficulty: Difficulty.HARD,
      },
      {
        topicId: mlSupervised.id,
        prompt: 'What distinguishes supervised learning from unsupervised learning?',
        options: [
          { id: 'a', text: 'Supervised learning uses labeled data; unsupervised does not' },
          { id: 'b', text: 'Supervised learning requires no data at all' },
          { id: 'c', text: 'Unsupervised learning is always more accurate' },
          { id: 'd', text: 'There is no difference' },
        ],
        correctOptionId: 'a',
        explanation: 'Supervised learning trains on labeled input-output pairs; unsupervised finds patterns in unlabeled data.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: mlEvaluation.id,
        prompt: 'What does "overfitting" mean in machine learning?',
        options: [
          { id: 'a', text: 'The model performs well on training data but poorly on new data' },
          { id: 'b', text: 'The model is too simple to capture patterns' },
          { id: 'c', text: 'The model trains too quickly' },
          { id: 'd', text: 'The dataset is too small to use' },
        ],
        correctOptionId: 'a',
        explanation: 'Overfitting means the model memorized training data rather than learning generalizable patterns.',
        difficulty: Difficulty.MEDIUM,
      },
    ],
  });

  console.log('Additional topics (MongoDB, System Design, AI/ML Basics) seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });