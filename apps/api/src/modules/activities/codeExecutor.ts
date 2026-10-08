import vm from 'vm';
import { runJudge0TestCases, Judge0ConfigError } from './judge0Executor';

export { Judge0ConfigError };

const EXECUTION_TIMEOUT_MS = 1000;

export interface TestCase {
  input: unknown[];
  expectedOutput: unknown;
}

export interface TestResult {
  passed: boolean;
  actualOutput?: unknown;
  error?: string;
}

/**
 * Runs student-submitted code against test cases using Node's vm module.
 *
 * IMPORTANT: Node's own docs state the vm module is NOT a security boundary —
 * it can be escaped by sufficiently crafted input. This is acceptable here
 * only because this is a local, single-user portfolio project. It must NOT
 * be exposed to untrusted public users without a real isolation layer
 * (e.g. a containerized/hosted execution service) in front of it.
 */
export function runTestCases(
  functionName: string,
  submittedCode: string,
  testCases: TestCase[]
): TestResult[] {
  return testCases.map((testCase) => runSingleTestCase(functionName, submittedCode, testCase));
}

function runSingleTestCase(functionName: string, submittedCode: string, testCase: TestCase): TestResult {
  try {
    const context = vm.createContext({});
    const wrapped = `
      ${submittedCode}
      ;typeof ${functionName} === 'function' ? ${functionName}(...${JSON.stringify(testCase.input)}) : undefined;
    `;

        const script = new vm.Script(wrapped);
    const actualOutput = script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });

    const passed = JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput);
    return { passed, actualOutput };
  } catch (err: any) {
    return { passed: false, error: (err.message ?? 'Execution failed').slice(0, 300) };
  }
}

import { runPythonTestCases } from './pistonExecutor';

export async function runTestCasesForLanguage(
  language: string,
  functionName: string,
  submittedCode: string,
  testCases: TestCase[]
): Promise<TestResult[]> {
  if (language === 'python' || language === 'cpp' || language === 'java') {
    return runJudge0TestCases(language, functionName, submittedCode, testCases);
  }
  // default: javascript, via the existing local vm executor
  return runTestCases(functionName, submittedCode, testCases);
}