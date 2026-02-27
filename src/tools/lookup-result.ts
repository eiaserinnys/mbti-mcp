/**
 * lookup_result 도구
 *
 * 이전 테스트 결과를 검색합니다.
 */

import { findResultsByName, getRecentResults } from '../db/sqlite.js';
import type { LookupResultResponse } from '../types.js';

export interface LookupResultInput {
  name?: string;
  limit?: number;
}

/**
 * 결과 검색
 *
 * @param input - 검색 조건 (이름, 제한 수)
 * @returns 검색 결과 목록
 */
export function lookupResult(input: LookupResultInput): LookupResultResponse {
  const limit = input.limit ?? 10;

  let rows;
  if (input.name && input.name.trim() !== '') {
    rows = findResultsByName(input.name.trim());
    // 결과 수 제한
    rows = rows.slice(0, limit);
  } else {
    rows = getRecentResults(limit);
  }

  return {
    results: rows.map((row) => ({
      session_id: row.session_id,
      name: row.name,
      mbti_type: row.mbti_type,
      completed_at: row.completed_at,
    })),
  };
}
