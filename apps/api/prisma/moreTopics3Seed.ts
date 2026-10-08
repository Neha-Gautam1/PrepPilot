import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const js = await prisma.topic.create({ data: { name: 'JavaScript', slug: 'javascript' } });
  const react = await prisma.topic.create({ data: { name: 'React', slug: 'react' } });
  const node = await prisma.topic.create({ data: { name: 'Node.js', slug: 'nodejs' } });

  const jsClosures = await prisma.topic.create({
    data: { name: 'Closures & Scope', slug: 'js-closures-scope', parentId: js.id },
  });
  const jsAsync = await prisma.topic.create({
    data: { name: 'Async & Promises', slug: 'js-async', parentId: js.id },
  });
  const reactHooks = await prisma.topic.create({
    data: { name: 'Hooks', slug: 'react-hooks', parentId: react.id },
  });
  const reactLifecycle = await prisma.topic.create({
    data: { name: 'Component Lifecycle', slug: 'react-lifecycle', parentId: react.id },
  });
  const nodeEventLoop = await prisma.topic.create({
    data: { name: 'Event Loop', slug: 'node-event-loop', parentId: node.id },
  });
  const nodeModules = await prisma.topic.create({
    data: { name: 'Modules & npm', slug: 'node-modules', parentId: node.id },
  });

  await prisma.question.createMany({
    data: [
      {
        topicId: jsClosures.id,
        prompt: 'What is a closure in JavaScript?',
        options: [
          { id: 'a', text: 'A function bundled with references to its surrounding state' },
          { id: 'b', text: 'A way to close a browser tab' },
          { id: 'c', text: 'A loop that terminates early' },
          { id: 'd', text: 'A type of error handling' },
        ],
        correctOptionId: 'a',
        explanation: 'A closure gives a function access to its outer scope even after that scope has returned.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: jsClosures.id,
        prompt: 'What will "let" declared inside a block be scoped to?',
        options: [
          { id: 'a', text: 'The global scope' },
          { id: 'b', text: 'The nearest function scope' },
          { id: 'c', text: 'The block it is declared in' },
          { id: 'd', text: 'The entire file' },
        ],
        correctOptionId: 'c',
        explanation: '"let" is block-scoped, unlike "var" which is function-scoped.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: jsAsync.id,
        prompt: 'What does "await" do inside an async function?',
        options: [
          { id: 'a', text: 'Pauses execution until the Promise resolves' },
          { id: 'b', text: 'Immediately rejects the Promise' },
          { id: 'c', text: 'Converts a Promise to a callback' },
          { id: 'd', text: 'Runs the function synchronously from the start' },
        ],
        correctOptionId: 'a',
        explanation: '"await" pauses the async function until the awaited Promise settles.',
        difficulty: Difficulty.EASY,
      },
      {
        topicId: reactHooks.id,
        prompt: 'When does useEffect with an empty dependency array run?',
        options: [
          { id: 'a', text: 'On every render' },
          { id: 'b', text: 'Only once, after the initial render' },
          { id: 'c', text: 'Never' },
          { id: 'd', text: 'Only when the component unmounts' },
        ],
        correctOptionId: 'b',
        explanation: 'An empty dependency array means the effect runs once, after the first render.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: reactLifecycle.id,
        prompt: 'In a function component, what replaces componentDidMount?',
        options: [
          { id: 'a', text: 'useState' },
          { id: 'b', text: 'useEffect with an empty dependency array' },
          { id: 'c', text: 'useContext' },
          { id: 'd', text: 'useReducer' },
        ],
        correctOptionId: 'b',
        explanation: 'useEffect(() => {...}, []) mimics componentDidMount behavior in function components.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: nodeEventLoop.id,
        prompt: 'Is Node.js single-threaded or multi-threaded for JavaScript execution?',
        options: [
          { id: 'a', text: 'Multi-threaded' },
          { id: 'b', text: 'Single-threaded, with an event loop handling async I/O' },
          { id: 'c', text: 'It depends on the OS' },
          { id: 'd', text: 'Neither — it uses coroutines' },
        ],
        correctOptionId: 'b',
        explanation: 'Node runs JS on a single thread, delegating I/O to the event loop and libuv thread pool.',
        difficulty: Difficulty.MEDIUM,
      },
      {
        topicId: nodeModules.id,
        prompt: 'What file defines a Node.js project\'s dependencies?',
        options: [
          { id: 'a', text: 'package.json' },
          { id: 'b', text: 'node.config.js' },
          { id: 'c', text: 'index.js' },
          { id: 'd', text: 'dependencies.json' },
        ],
        correctOptionId: 'a',
        explanation: 'package.json lists a project\'s dependencies, scripts, and metadata.',
        difficulty: Difficulty.EASY,
      },
    ],
  });

  console.log('Additional topics (JavaScript, React, Node.js) seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });