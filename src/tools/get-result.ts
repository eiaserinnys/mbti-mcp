/**
 * get_result 도구
 *
 * 완료된 테스트의 결과를 조회합니다.
 */

import {
  getSession,
  getAnswers,
  getResult,
  saveResult,
  updateSessionStatus,
} from '../db/sqlite.js';
import { calculateMBTIResult } from '../utils/scoring.js';
import { getTypeDescription } from '../data/descriptions.js';
import type { GetResultResponse } from '../types.js';

export interface GetResultInput {
  session_id: string;
}

const TOTAL_QUESTIONS = 32;

/**
 * 테스트 결과 조회
 *
 * @param input - 세션 ID
 * @returns MBTI 결과
 */
export function getResultTool(input: GetResultInput): GetResultResponse {
  const session = getSession(input.session_id);
  if (!session) {
    throw new Error('세션을 찾을 수 없습니다.');
  }

  // 이미 결과가 있으면 반환
  const existingResult = getResult(input.session_id);
  if (existingResult) {
    const scores = JSON.parse(existingResult.scores_json);
    const typeDesc = getTypeDescription(existingResult.mbti_type as any);

    return {
      name: existingResult.name,
      mbti_type: existingResult.mbti_type,
      scores,
      description: `${typeDesc.title}: ${typeDesc.description}`,
      completed_at: existingResult.completed_at,
    };
  }

  // 답변 확인
  const answers = getAnswers(input.session_id);
  if (answers.length < TOTAL_QUESTIONS) {
    throw new Error(
      `테스트가 완료되지 않았습니다. (${answers.length}/${TOTAL_QUESTIONS} 문항 완료)`
    );
  }

  // 결과 계산
  const { mbtiType, scores } = calculateMBTIResult(answers);
  const typeDesc = getTypeDescription(mbtiType);
  const completedAt = new Date().toISOString();

  // 결과 저장
  saveResult(input.session_id, session.name, mbtiType, scores);
  updateSessionStatus(input.session_id, 'completed', completedAt);

  return {
    name: session.name,
    mbti_type: mbtiType,
    scores,
    description: `${typeDesc.title}: ${typeDesc.description}`,
    completed_at: completedAt,
  };
}
