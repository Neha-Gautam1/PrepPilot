import { env } from '../../config/env';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com';

const LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python 3.8.1
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
};

export interface JudgeTestCase {
  input: unknown[];
  expectedOutput: unknown;
}

export interface TestResult {
  passed: boolean;
  actualOutput?: unknown;
  error?: string;
}

class Judge0ConfigError extends Error {}

function arrayToCsv(arr: unknown[]): string {
  return arr.map((v) => JSON.stringify(v)).join(', ');
}

function buildSource(language: 'python' | 'cpp' | 'java', functionName: string, submittedCode: string, input: unknown[]): string {
  const inputArray = input[0] as number[]; // current convention: single array-of-numbers input

  if (language === 'python') {
    const inputJson = JSON.stringify(input).replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'");
    return `${submittedCode}

import json
__args = json.loads('''${inputJson}''')
__result = ${functionName}(*__args)
print(json.dumps(__result))`;
  }

  if (language === 'cpp') {
    return `#include <bits/stdc++.h>
using namespace std;

${submittedCode}

int main() {
    vector<int> arr = {${arrayToCsv(inputArray)}};
    cout << ${functionName}(arr) << endl;
    return 0;
}`;
  }

  // java
  return `import java.util.*;

public class Main {
    ${submittedCode}

    public static void main(String[] args) {
        int[] arr = {${arrayToCsv(inputArray)}};
        System.out.println(${functionName}(arr));
    }
}`;
}

async function runOneTestCase(
  language: 'python' | 'cpp' | 'java',
  functionName: string,
  submittedCode: string,
  testCase: JudgeTestCase
): Promise<TestResult> {
  if (!env.JUDGE0_API_KEY) {
    throw new Judge0ConfigError('JUDGE0_API_KEY is not configured on the server');
  }

  const source = buildSource(language, functionName, submittedCode, testCase.input);
  const languageId = LANGUAGE_IDS[language];

  try {
    const res = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': env.JUDGE0_API_KEY,
        'X-RapidAPI-Host': JUDGE0_HOST,
      },
      body: JSON.stringify({
        source_code: source,
        language_id: languageId,
      }),
    });

    if (!res.ok) {
      return { passed: false, error: `Judge0 API error: ${res.status}` };
    }

    interface Judge0Response {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
      status?: { id: number; description: string };
    }

    const data = (await res.json()) as Judge0Response;

    if (data.compile_output) {
      return { passed: false, error: data.compile_output.slice(0, 300) };
    }
    if (data.stderr) {
      return { passed: false, error: data.stderr.slice(0, 300) };
    }

    const stdout = (data.stdout ?? '').trim();
    let actualOutput: unknown;

    if (language === 'python') {
      try {
        actualOutput = JSON.parse(stdout);
      } catch {
        return { passed: false, error: `Could not parse output: ${stdout.slice(0, 200)}` };
      }
    } else {
      // cpp/java: plain numeric stdout by convention
      const parsed = Number(stdout);
      if (Number.isNaN(parsed)) {
        return { passed: false, error: `Could not parse output: ${stdout.slice(0, 200)}` };
      }
      actualOutput = parsed;
    }

    const passed = JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput);
    return { passed, actualOutput };
  } catch (err: any) {
    if (err instanceof Judge0ConfigError) throw err;
    return { passed: false, error: (err.message ?? 'Judge0 request failed').slice(0, 300) };
  }
}

export async function runJudge0TestCases(
  language: 'python' | 'cpp' | 'java',
  functionName: string,
  submittedCode: string,
  testCases: JudgeTestCase[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const testCase of testCases) {
    results.push(await runOneTestCase(language, functionName, submittedCode, testCase));
  }
  return results;
}

export { Judge0ConfigError };