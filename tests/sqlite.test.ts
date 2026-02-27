/**
 * SQLite 데이터베이스 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initTestDatabase,
  closeDatabase,
  createSession,
  getSession,
  updateSessionStatus,
  updateCurrentQuestion,
  saveAnswer,
  getAnswers,
  getAnswerCount,
  saveResult,
  getResult,
  findResultsByName,
  getRecentResults,
} from '../src/db/sqlite.js';

describe('SQLite Database', () => {
  beforeEach(() => {
    initTestDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('Session CRUD', () => {
    it('세션 생성 및 조회', () => {
      const session = createSession('테스트유저');

      expect(session.id).toBeDefined();
      expect(session.name).toBe('테스트유저');
      expect(session.status).toBe('in_progress');
      expect(session.current_question).toBe(1);
      expect(session.agent_id).toBeNull();
    });

    it('에이전트 ID와 함께 세션 생성', () => {
      const session = createSession('AI에이전트', 'agent-123');

      expect(session.agent_id).toBe('agent-123');
    });

    it('세션 상태 업데이트', () => {
      const session = createSession('테스트유저');
      updateSessionStatus(session.id, 'completed', '2026-01-01T00:00:00Z');

      const updated = getSession(session.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completed_at).toBe('2026-01-01T00:00:00Z');
    });

    it('현재 문항 번호 업데이트', () => {
      const session = createSession('테스트유저');
      updateCurrentQuestion(session.id, 5);

      const updated = getSession(session.id);
      expect(updated?.current_question).toBe(5);
    });

    it('존재하지 않는 세션 조회 시 null 반환', () => {
      const session = getSession('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('Answer CRUD', () => {
    it('답변 저장 및 조회', () => {
      const session = createSession('테스트유저');

      saveAnswer(session.id, 1, 3);
      saveAnswer(session.id, 2, 4);

      const answers = getAnswers(session.id);
      expect(answers).toHaveLength(2);
      expect(answers[0]).toEqual({ questionNumber: 1, answer: 3 });
      expect(answers[1]).toEqual({ questionNumber: 2, answer: 4 });
    });

    it('같은 문항에 다시 답변 시 덮어쓰기', () => {
      const session = createSession('테스트유저');

      saveAnswer(session.id, 1, 3);
      saveAnswer(session.id, 1, 5);

      const answers = getAnswers(session.id);
      expect(answers).toHaveLength(1);
      expect(answers[0].answer).toBe(5);
    });

    it('답변 수 조회', () => {
      const session = createSession('테스트유저');

      saveAnswer(session.id, 1, 3);
      saveAnswer(session.id, 2, 4);
      saveAnswer(session.id, 3, 5);

      expect(getAnswerCount(session.id)).toBe(3);
    });
  });

  describe('Result CRUD', () => {
    it('결과 저장 및 조회', () => {
      const session = createSession('테스트유저');
      const scores = {
        E: 60,
        I: 40,
        S: 55,
        N: 45,
        T: 70,
        F: 30,
        J: 65,
        P: 35,
      };

      saveResult(session.id, '테스트유저', 'ESTJ', scores);

      const result = getResult(session.id);
      expect(result).not.toBeNull();
      expect(result?.mbti_type).toBe('ESTJ');
      expect(result?.name).toBe('테스트유저');

      const savedScores = JSON.parse(result!.scores_json);
      expect(savedScores.E).toBe(60);
    });

    it('이름으로 결과 검색', () => {
      const session1 = createSession('도로시');
      const session2 = createSession('앨리스');
      const session3 = createSession('도로시봇');

      const scores = {
        E: 50,
        I: 50,
        S: 50,
        N: 50,
        T: 50,
        F: 50,
        J: 50,
        P: 50,
      };

      saveResult(session1.id, '도로시', 'INFP', scores);
      saveResult(session2.id, '앨리스', 'ENFJ', scores);
      saveResult(session3.id, '도로시봇', 'INTP', scores);

      const results = findResultsByName('도로시');
      expect(results).toHaveLength(2);
    });

    it('최근 결과 조회', () => {
      const sessions = [
        createSession('유저1'),
        createSession('유저2'),
        createSession('유저3'),
      ];

      const scores = {
        E: 50,
        I: 50,
        S: 50,
        N: 50,
        T: 50,
        F: 50,
        J: 50,
        P: 50,
      };

      sessions.forEach((s, i) => {
        saveResult(s.id, `유저${i + 1}`, 'INFP', scores);
      });

      const results = getRecentResults(2);
      expect(results).toHaveLength(2);
    });
  });
});
