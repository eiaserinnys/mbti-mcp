#!/usr/bin/env node
/**
 * MBTI MCP HTTP Server
 *
 * HTTP Streaming 방식의 MCP 서버
 * supergateway 없이 직접 Streamable HTTP 프로토콜 지원
 */

import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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

// 환경 변수
const PORT = parseInt(process.env.MBTI_MCP_PORT || '8004', 10);
const DB_PATH = process.env.MBTI_DB_PATH || 'data/mbti.db';

// 도구 목록 정의
const tools = [
  {
    name: 'start_test',
    description:
      '새로운 MBTI 테스트 세션을 시작합니다. 참여자 이름을 입력하면 세션 ID가 반환됩니다.',
    inputSchema: {
      type: 'object' as const,
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
      type: 'object' as const,
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
      type: 'object' as const,
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
      type: 'object' as const,
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
    description:
      '이전 테스트 결과를 검색합니다. 이름으로 검색하거나 최근 결과를 조회할 수 있습니다.',
    inputSchema: {
      type: 'object' as const,
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
    description:
      '테스트 세션의 현재 상태를 조회합니다. 진행률과 현재 문항 번호를 확인할 수 있습니다.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: '테스트 세션 ID (필수)',
        },
      },
      required: ['session_id'],
    },
  },
];

// MCP 서버 생성 함수
function createMcpServer(): Server {
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
    return { tools };
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

  return server;
}

// MCP 요청 핸들러 (stateless mode)
async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  try {
    // 매 요청마다 새 서버와 transport 생성 (stateless mode)
    // 하지만 단일 프로세스 내에서 처리하므로 메모리 누수 없음
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode - no session management
    });

    // 서버와 transport 연결
    await server.connect(transport);

    // 요청 처리
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}

// Express 앱 설정
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.send('ok');
});

// MCP endpoint - POST only (stateless mode)
app.post('/mcp', handleMcpRequest);

// MCP endpoint - GET returns 405 (stateless mode doesn't support SSE streaming)
app.get('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message:
      'This MCP endpoint operates in stateless mode and does not support GET requests for SSE streaming',
  });
});

// MCP endpoint - DELETE returns 405 (stateless mode doesn't support session termination)
app.delete('/mcp', (_req, res) => {
  res.status(405).json({
    error: 'Method not allowed',
    message:
      'This MCP endpoint operates in stateless mode and does not support session termination',
  });
});

// 서버 시작
async function main(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');

  // 데이터 디렉토리 확인/생성
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

  // HTTP 서버 시작
  app.listen(PORT, () => {
    console.log(`MBTI MCP HTTP Server started on port ${PORT}`);
    console.log(`  - Health: http://localhost:${PORT}/health`);
    console.log(`  - MCP: http://localhost:${PORT}/mcp (Streamable HTTP)`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
