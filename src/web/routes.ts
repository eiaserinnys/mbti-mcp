/**
 * REST API 라우트
 *
 * MCP 도구와 동일한 로직을 HTTP API로 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { startTest } from '../tools/start-test.js';
import { getQuestionTool } from '../tools/get-question.js';
import { answerQuestion } from '../tools/answer-question.js';
import { getResultTool } from '../tools/get-result.js';
import { saveSessionIp } from '../db/sqlite.js';

/**
 * 클라이언트 IP 추출
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * API 라우터 생성
 */
export function createRoutes(): Router {
  const router = Router();

  /**
   * POST /api/start
   * 새 테스트 세션 시작
   */
  router.post('/start', (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          error: '이름을 입력해주세요.',
        });
      }

      const result = startTest({ name: name.trim() });

      // IP 저장
      const ip = getClientIp(req);
      saveSessionIp(result.session_id, ip);

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  });

  /**
   * GET /api/question/:sessionId
   * 현재 문항 조회
   */
  router.get('/question/:sessionId', (req: Request, res: Response) => {
    try {
      const sessionId = Array.isArray(req.params.sessionId)
        ? req.params.sessionId[0]
        : req.params.sessionId;
      const questionNumber = req.query.number
        ? parseInt(req.query.number as string, 10)
        : undefined;

      const result = getQuestionTool({
        session_id: sessionId,
        question_number: questionNumber,
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  });

  /**
   * POST /api/answer
   * 문항에 답변
   */
  router.post('/answer', (req: Request, res: Response) => {
    try {
      const { session_id, question_number, answer } = req.body;

      if (!session_id || question_number === undefined || answer === undefined) {
        return res.status(400).json({
          error: '세션 ID, 문항 번호, 답변은 필수입니다.',
        });
      }

      const result = answerQuestion({
        session_id,
        question_number: parseInt(question_number, 10),
        answer: parseInt(answer, 10),
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  });

  /**
   * GET /api/result/:sessionId
   * 테스트 결과 조회
   */
  router.get('/result/:sessionId', (req: Request, res: Response) => {
    try {
      const sessionId = Array.isArray(req.params.sessionId)
        ? req.params.sessionId[0]
        : req.params.sessionId;

      const result = getResultTool({ session_id: sessionId });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  });

  return router;
}
