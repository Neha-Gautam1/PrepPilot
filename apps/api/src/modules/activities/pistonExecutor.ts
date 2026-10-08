const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const PYTHON_VERSION = '3.10.0';

export interface PythonTestCase {
  input: unknown[];
  expectedOutput: unknown;
}

export interface TestResult {
  passed: boolean;
  actualOutput?: unknown;
  error?: string;
}

function buildPythonSource(functionName: string, submittedCode: string, input: unknown[]): string {
  const inputJson = JSON.stringify(input).replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'");

  return `${submittedCode}

import json
__args = json.loads('''${inputJson}''')
__result = ${functionName}(*__args)
print(json.dumps(__result))`;
}

async function runOnePythonTestCase(
  functionName: string,
  submittedCode: string,
  testCase: PythonTestCase
): Promise<TestResult> {
  const source = buildPythonSource(functionName, submittedCode, testCase.input);

  try {
    const res = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        version: PYTHON_VERSION,
        files: [{ content: source }],
      }),
    });

    if (!res.ok) {
      return { passed: false, error: `Piston API error: ${res.status}` };
    }

          interface PistonResponse {
      run?: { stdout?: string; stderr?: string };
    }

    const data = (await res.json()) as PistonResponse;

    if (data.run?.stderr) {
      return { passed: false, error: data.run.stderr.slice(0, 300) };
    }

    const stdout = (data.run?.stdout ?? '').trim();
    let actualOutput: unknown;
    try {
      actualOutput = JSON.parse(stdout);
    } catch {
      return { passed: false, error: `Could not parse output: ${stdout.slice(0, 200)}` };
    }

    const passed = JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput);
    return { passed, actualOutput };
  } catch (err: any) {
    return { passed: false, error: (err.message ?? 'Piston request failed').slice(0, 300) };
  }
}

export async function runPythonTestCases(
  functionName: string,
  submittedCode: string,
  testCases: PythonTestCase[]
): Promise<TestResult[]> {
  // Run sequentially rather than in parallel — Piston's public instance is
  // free and shared, so avoid hammering it with concurrent requests from
  // one submission.
  const results: TestResult[] = [];
  for (const testCase of testCases) {
    results.push(await runOnePythonTestCase(functionName, submittedCode, testCase));
  }
  return results;
}