/**
 * start_test 도구
 *
 * 새로운 MBTI 테스트 세션을 시작합니다.
 */

import { createSession } from '../db/sqlite.js';
import type { StartTestResponse } from '../types.js';
import { questions } from '../data/questions.js';

export interface StartTestInput {
  name: string;
  agent_id?: string;
}

/**
 * 새 테스트 세션 시작
 *
 * @param input - 참여자 이름과 에이전트 ID (선택)
 * @returns 세션 정보
 */
export function startTest(input: StartTestInput): StartTestResponse {
  if (!input.name || input.name.trim() === '') {
    throw new Error('참여자 이름은 필수입니다.');
  }

  const session = createSession(input.name.trim(), input.agent_id);

  return {
    session_id: session.id,
    name: session.name,
    total_questions: 32 as const,
    message: `안녕하세요, ${session.name}님! MBTI 테스트를 시작합니다. 총 ${questions.length}개의 문항이 있습니다. get_question 도구로 첫 번째 문항을 확인해주세요.`,
  };
}
