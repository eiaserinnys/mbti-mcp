/**
 * answer_question 도구
 *
 * 문항에 답변합니다.
 */

import {
  getSession,
  saveAnswer,
  updateCurrentQuestion,
  updateSessionStatus,
  getAnswerCount,
} from '../db/sqlite.js';
import type { AnswerQuestionResponse } from '../types.js';

export interface AnswerQuestionInput {
  session_id: string;
  question_number: number;
  answer: number;
}

const TOTAL_QUESTIONS = 32;

/**
 * 문항 답변
 *
 * @param input - 세션 ID, 문항 번호, 답변 값
 * @returns 답변 결과
 */
export function answerQuestion(input: AnswerQuestionInput): AnswerQuestionResponse {
  const session = getSession(input.session_id);
  if (!session) {
    throw new Error('세션을 찾을 수 없습니다.');
  }

  if (session.status === 'completed') {
    throw new Error('이미 완료된 테스트입니다.');
  }

  if (input.question_number < 1 || input.question_number > TOTAL_QUESTIONS) {
    throw new Error('문항 번호는 1-32 사이여야 합니다.');
  }

  if (![1, 2, 3, 4, 5].includes(input.answer)) {
    throw new Error('답변은 1-5 사이의 정수여야 합니다.');
  }

  // 답변 저장
  saveAnswer(
    input.session_id,
    input.question_number,
    input.answer as 1 | 2 | 3 | 4 | 5
  );

  // 답변 수 확인
  const answerCount = getAnswerCount(input.session_id);

  // 다음 문항 계산
  let nextQuestion: number | null = null;
  if (input.question_number < TOTAL_QUESTIONS) {
    nextQuestion = input.question_number + 1;
    updateCurrentQuestion(input.session_id, nextQuestion);
  }

  // 모든 문항 완료 시 상태 업데이트
  if (answerCount >= TOTAL_QUESTIONS) {
    updateSessionStatus(input.session_id, 'completed', new Date().toISOString());
    nextQuestion = null;
  }

  return {
    accepted: true,
    question_number: input.question_number,
    next_question: nextQuestion,
    progress: `${answerCount}/${TOTAL_QUESTIONS}`,
  };
}
