/**
 * MCP 도구 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initTestDatabase, closeDatabase } from '../src/db/sqlite.js';
import { startTest } from '../src/tools/start-test.js';
import { getQuestionTool } from '../src/tools/get-question.js';
import { answerQuestion } from '../src/tools/answer-question.js';
import { getResultTool } from '../src/tools/get-result.js';
import { lookupResult } from '../src/tools/lookup-result.js';
import { getSessionStatus } from '../src/tools/get-session-status.js';

describe('MCP Tools', () => {
  beforeEach(() => {
    initTestDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('start_test', () => {
    it('새 세션 생성', () => {
      const result = startTest({ name: '테스트유저' });

      expect(result.session_id).toBeDefined();
      expect(result.name).toBe('테스트유저');
      expect(result.total_questions).toBe(32);
      expect(result.message).toContain('테스트유저');
    });

    it('빈 이름 시 에러', () => {
      expect(() => startTest({ name: '' })).toThrow('참여자 이름은 필수입니다');
    });
  });

  describe('get_question', () => {
    it('첫 번째 문항 조회', () => {
      const session = startTest({ name: '테스트유저' });
      const question = getQuestionTool({ session_id: session.session_id });

      expect(question.question_number).toBe(1);
      expect(question.total_questions).toBe(32);
      expect(question.option_a).toBeDefined();
      expect(question.option_b).toBeDefined();
    });

    it('특정 문항 조회', () => {
      const session = startTest({ name: '테스트유저' });
      const question = getQuestionTool({
        session_id: session.session_id,
        question_number: 5,
      });

      expect(question.question_number).toBe(5);
    });

    it('잘못된 세션 ID 시 에러', () => {
      expect(() =>
        getQuestionTool({ session_id: 'invalid-id' })
      ).toThrow('세션을 찾을 수 없습니다');
    });
  });

  describe('answer_question', () => {
    it('문항 답변', () => {
      const session = startTest({ name: '테스트유저' });
      const result = answerQuestion({
        session_id: session.session_id,
        question_number: 1,
        answer: 3,
      });

      expect(result.accepted).toBe(true);
      expect(result.question_number).toBe(1);
      expect(result.next_question).toBe(2);
      expect(result.progress).toBe('1/32');
    });

    it('잘못된 답변 값 시 에러', () => {
      const session = startTest({ name: '테스트유저' });
      expect(() =>
        answerQuestion({
          session_id: session.session_id,
          question_number: 1,
          answer: 6,
        })
      ).toThrow('답변은 1-5 사이');
    });
  });

  describe('get_session_status', () => {
    it('세션 상태 조회', () => {
      const session = startTest({ name: '테스트유저' });
      answerQuestion({
        session_id: session.session_id,
        question_number: 1,
        answer: 3,
      });

      const status = getSessionStatus({ session_id: session.session_id });

      expect(status.session_id).toBe(session.session_id);
      expect(status.name).toBe('테스트유저');
      expect(status.status).toBe('in_progress');
      expect(status.answers_count).toBe(1);
    });
  });

  describe('get_result', () => {
    it('모든 문항 답변 후 결과 조회', () => {
      const session = startTest({ name: '테스트유저' });

      // 32문항 모두 답변 (중립)
      for (let i = 1; i <= 32; i++) {
        answerQuestion({
          session_id: session.session_id,
          question_number: i,
          answer: 3,
        });
      }

      const result = getResultTool({ session_id: session.session_id });

      expect(result.name).toBe('테스트유저');
      expect(result.mbti_type).toHaveLength(4);
      expect(result.scores).toBeDefined();
      expect(result.description).toBeDefined();
    });

    it('미완료 테스트 결과 조회 시 에러', () => {
      const session = startTest({ name: '테스트유저' });
      answerQuestion({
        session_id: session.session_id,
        question_number: 1,
        answer: 3,
      });

      expect(() =>
        getResultTool({ session_id: session.session_id })
      ).toThrow('테스트가 완료되지 않았습니다');
    });
  });

  describe('lookup_result', () => {
    it('최근 결과 조회', () => {
      // 테스트 완료
      const session = startTest({ name: '테스트유저' });
      for (let i = 1; i <= 32; i++) {
        answerQuestion({
          session_id: session.session_id,
          question_number: i,
          answer: 3,
        });
      }
      getResultTool({ session_id: session.session_id });

      const lookup = lookupResult({});
      expect(lookup.results).toHaveLength(1);
      expect(lookup.results[0].name).toBe('테스트유저');
    });

    it('이름으로 결과 검색', () => {
      // 두 테스트 완료
      const session1 = startTest({ name: '도로시' });
      const session2 = startTest({ name: '앨리스' });

      for (let i = 1; i <= 32; i++) {
        answerQuestion({
          session_id: session1.session_id,
          question_number: i,
          answer: 3,
        });
        answerQuestion({
          session_id: session2.session_id,
          question_number: i,
          answer: 3,
        });
      }
      getResultTool({ session_id: session1.session_id });
      getResultTool({ session_id: session2.session_id });

      const lookup = lookupResult({ name: '도로시' });
      expect(lookup.results).toHaveLength(1);
      expect(lookup.results[0].name).toBe('도로시');
    });
  });

  describe('Full Test Flow', () => {
    it('전체 테스트 플로우', () => {
      // 1. 테스트 시작
      const session = startTest({ name: '도로시', agent_id: 'dorothy-bot' });
      expect(session.session_id).toBeDefined();

      // 2. 첫 문항 확인
      const q1 = getQuestionTool({ session_id: session.session_id });
      expect(q1.question_number).toBe(1);

      // 3. 강한 E 성향으로 답변 (EI 문항 1-8)
      // 나머지는 중립
      for (let i = 1; i <= 32; i++) {
        let answer = 3;
        if (i <= 8) {
          // EI 문항: E 방향으로 답변
          answer = i % 2 === 1 ? 1 : 5; // 홀수는 1, 짝수는 5 (문항별 scoring 고려)
        }
        answerQuestion({
          session_id: session.session_id,
          question_number: i,
          answer,
        });
      }

      // 4. 세션 상태 확인
      const status = getSessionStatus({ session_id: session.session_id });
      expect(status.status).toBe('completed');
      expect(status.answers_count).toBe(32);

      // 5. 결과 확인
      const result = getResultTool({ session_id: session.session_id });
      expect(result.name).toBe('도로시');
      expect(result.mbti_type).toHaveLength(4);

      // 6. 결과 검색
      const lookup = lookupResult({ name: '도로시' });
      expect(lookup.results.length).toBeGreaterThan(0);
    });
  });
});
