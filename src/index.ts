#!/usr/bin/env node
/**
 * MBTI MCP Server
 *
 * AI 에이전트들이 MBTI 성격 유형 테스트를 수행할 수 있는 MCP 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initDatabase, closeDatabase } from './db/sqlite.js';
import { startTest } from './tools/start-test.js';
import { getQuestionTool } from './tools/get-question.js';
import { answerQuestion } from './tools/answer-question.js';
import { getResultTool } from './tools/get-result.js';
import { lookupResult } from './tools/lookup-result.js';
import { getSessionStatus } from './tools/get-session-status.js';

// 데이터베이스 경로 (환경 변수로 설정 가능)
const DB_PATH = process.env.MBTI_DB_PATH || 'data/mbti.db';

// MCP 서버 생성
const server = new Server(
  {
    name: 'mbti-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_test',
        description:
          '새로운 MBTI 테스트 세션을 시작합니다. 참여자 이름을 입력하면 세션 ID가 반환됩니다.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '테스트 참여자 이름 (필수)',
            },
            agent_id: {
              type: 'string',
              description: '에이전트 식별자 (선택)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_question',
        description:
          '현재 또는 특정 문항을 조회합니다. 선택지 A와 B가 표시되며, 1-5 척도로 답변해야 합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: '테스트 세션 ID (필수)',
            },
            question_number: {
              type: 'integer',
              description: '조회할 문항 번호 (1-32, 생략 시 현재 문항)',
              minimum: 1,
              maximum: 32,
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'answer_question',
        description:
          '문항에 답변합니다. 1(A에 매우 가까움)에서 5(B에 매우 가까움) 사이의 값으로 답변합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: '테스트 세션 ID (필수)',
            },
            question_number: {
              type: 'integer',
              description: '답변할 문항 번호 (1-32, 필수)',
              minimum: 1,
              maximum: 32,
            },
            answer: {
              type: 'integer',
              description:
                '답변 값 (1=A에 매우 가까움, 3=중립, 5=B에 매우 가까움)',
              minimum: 1,
              maximum: 5,
            },
          },
          required: ['session_id', 'question_number', 'answer'],
        },
      },
      {
        name: 'get_result',
        description:
          '완료된 테스트의 MBTI 결과를 조회합니다. 유형, 점수, 설명이 포함됩니다.',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: '테스트 세션 ID (필수)',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'lookup_result',
        description: '이전 테스트 결과를 검색합니다. 이름으로 검색하거나 최근 결과를 조회할 수 있습니다.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '검색할 이름 (부분 일치, 생략 시 최근 결과)',
            },
            limit: {
              type: 'integer',
              description: '최대 결과 수 (기본: 10)',
              minimum: 1,
              maximum: 100,
            },
          },
        },
      },
      {
        name: 'get_session_status',
        description: '테스트 세션의 현재 상태를 조회합니다. 진행률과 현재 문항 번호를 확인할 수 있습니다.',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: '테스트 세션 ID (필수)',
            },
          },
          required: ['session_id'],
        },
      },
    ],
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'start_test':
        result = startTest(args as any);
        break;
      case 'get_question':
        result = getQuestionTool(args as any);
        break;
      case 'answer_question':
        result = answerQuestion(args as any);
        break;
      case 'get_result':
        result = getResultTool(args as any);
        break;
      case 'lookup_result':
        result = lookupResult(args as any);
        break;
      case 'get_session_status':
        result = getSessionStatus(args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: message }),
        },
      ],
      isError: true,
    };
  }
});

// 서버 시작
async function main() {
  // 데이터 디렉토리 확인/생성
  const path = await import('path');
  const fs = await import('fs');
  const dbDir = path.dirname(DB_PATH);
  if (dbDir && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 데이터베이스 초기화
  initDatabase(DB_PATH);

  // 종료 핸들러
  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });

  // stdio 트랜스포트로 서버 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MBTI MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
