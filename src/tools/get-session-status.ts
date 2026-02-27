/**
 * get_session_status 도구
 *
 * 세션의 현재 상태를 조회합니다.
 */

import { getSession, getAnswerCount } from '../db/sqlite.js';
import type { GetSessionStatusResponse } from '../types.js';

export interface GetSessionStatusInput {
  session_id: string;
}

/**
 * 세션 상태 조회
 *
 * @param input - 세션 ID
 * @returns 세션 상태 정보
 */
export function getSessionStatus(
  input: GetSessionStatusInput
): GetSessionStatusResponse {
  const session = getSession(input.session_id);
  if (!session) {
    throw new Error('세션을 찾을 수 없습니다.');
  }

  const answerCount = getAnswerCount(input.session_id);

  return {
    session_id: session.id,
    name: session.name,
    status: session.status,
    current_question: session.current_question,
    answers_count: answerCount,
  };
}
