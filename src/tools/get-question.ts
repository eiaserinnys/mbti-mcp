/**
 * get_question 도구
 *
 * 현재 문항 또는 특정 문항을 조회합니다.
 */

import { getSession } from '../db/sqlite.js';
import { getQuestion, answerInstruction } from '../data/questions.js';
import type { GetQuestionResponse } from '../types.js';

export interface GetQuestionInput {
  session_id: string;
  question_number?: number;
}

/**
 * 문항 조회
 *
 * @param input - 세션 ID와 문항 번호 (선택)
 * @returns 문항 정보
 */
export function getQuestionTool(input: GetQuestionInput): GetQuestionResponse {
  const session = getSession(input.session_id);
  if (!session) {
    throw new Error('세션을 찾을 수 없습니다.');
  }

  if (session.status === 'completed') {
    throw new Error('이미 완료된 테스트입니다. get_result로 결과를 확인하세요.');
  }

  const questionNumber = input.question_number ?? session.current_question;

  if (questionNumber < 1 || questionNumber > 32) {
    throw new Error('문항 번호는 1-32 사이여야 합니다.');
  }

  const question = getQuestion(questionNumber);
  if (!question) {
    throw new Error(`문항 ${questionNumber}을(를) 찾을 수 없습니다.`);
  }

  return {
    question_number: questionNumber,
    total_questions: 32 as const,
    option_a: question.optionA,
    option_b: question.optionB,
    scale: '1(A에 매우 가까움) ~ 5(B에 매우 가까움)',
    instruction: answerInstruction,
  };
}
