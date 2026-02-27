/**
 * MBTI 점수 계산 로직
 *
 * 답변 척도 (1-5):
 * 1: 선택지 A에 매우 가까움 → A쪽 1.00점
 * 2: 선택지 A에 약간 가까움 → A쪽 0.75점, B쪽 0.25점
 * 3: 둘 다 비슷함 (중립)   → A쪽 0.50점, B쪽 0.50점
 * 4: 선택지 B에 약간 가까움 → A쪽 0.25점, B쪽 0.75점
 * 5: 선택지 B에 매우 가까움 → B쪽 1.00점
 *
 * scoring 필드:
 * - 'A': A쪽이 첫 글자 (E, S, T, J)
 * - 'B': A쪽이 둘째 글자 (I, N, F, P)
 */

import type {
  Answer,
  MBTIType,
  MBTIDimension,
  RawScores,
  Scores,
} from '../types.js';
import { getQuestion } from '../data/questions.js';

/**
 * 답변 값에 따른 A/B 점수 배분
 */
function getScoreDistribution(answer: 1 | 2 | 3 | 4 | 5): {
  aScore: number;
  bScore: number;
} {
  switch (answer) {
    case 1:
      return { aScore: 1.0, bScore: 0.0 };
    case 2:
      return { aScore: 0.75, bScore: 0.25 };
    case 3:
      return { aScore: 0.5, bScore: 0.5 };
    case 4:
      return { aScore: 0.25, bScore: 0.75 };
    case 5:
      return { aScore: 0.0, bScore: 1.0 };
  }
}

/**
 * 차원의 첫 번째/두 번째 특성 반환
 */
function getDimensionTraits(dimension: MBTIDimension): {
  first: keyof RawScores;
  second: keyof RawScores;
} {
  switch (dimension) {
    case 'EI':
      return { first: 'E', second: 'I' };
    case 'SN':
      return { first: 'S', second: 'N' };
    case 'TF':
      return { first: 'T', second: 'F' };
    case 'JP':
      return { first: 'J', second: 'P' };
  }
}

/**
 * 원시 점수 계산
 *
 * @param answers - 답변 배열
 * @returns 각 특성별 원시 점수
 */
export function calculateRawScores(answers: Answer[]): RawScores {
  const scores: RawScores = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  };

  for (const answer of answers) {
    const question = getQuestion(answer.questionNumber);
    if (!question) continue;

    const { aScore, bScore } = getScoreDistribution(answer.answer);
    const { first, second } = getDimensionTraits(question.dimension);

    if (question.scoring === 'A') {
      // A쪽이 첫 글자 (E, S, T, J)
      scores[first] += aScore;
      scores[second] += bScore;
    } else {
      // A쪽이 둘째 글자 (I, N, F, P)
      scores[second] += aScore;
      scores[first] += bScore;
    }
  }

  return scores;
}

/**
 * 원시 점수를 백분율로 변환
 *
 * @param raw - 원시 점수
 * @returns 백분율 점수 (0-100)
 */
export function calculatePercentages(raw: RawScores): Scores {
  const calculatePair = (a: number, b: number): [number, number] => {
    const total = a + b;
    if (total === 0) return [50, 50];
    return [Math.round((a / total) * 100), Math.round((b / total) * 100)];
  };

  const [E, I] = calculatePair(raw.E, raw.I);
  const [S, N] = calculatePair(raw.S, raw.N);
  const [T, F] = calculatePair(raw.T, raw.F);
  const [J, P] = calculatePair(raw.J, raw.P);

  return { E, I, S, N, T, F, J, P };
}

/**
 * 백분율 점수로 MBTI 유형 결정
 *
 * 동점 시 두 번째 글자(I, N, F, P) 선택
 *
 * @param scores - 백분율 점수
 * @returns MBTI 유형
 */
export function determineMBTIType(scores: Scores): MBTIType {
  // 동점 시 두 번째 글자 우선 (I, N, F, P)
  const firstLetter = scores.E > scores.I ? 'E' : 'I';
  const secondLetter = scores.S > scores.N ? 'S' : 'N';
  const thirdLetter = scores.T > scores.F ? 'T' : 'F';
  const fourthLetter = scores.J > scores.P ? 'J' : 'P';

  return `${firstLetter}${secondLetter}${thirdLetter}${fourthLetter}` as MBTIType;
}

/**
 * 답변으로부터 MBTI 결과 계산
 *
 * @param answers - 32개 답변
 * @returns MBTI 유형과 점수
 */
export function calculateMBTIResult(answers: Answer[]): {
  mbtiType: MBTIType;
  scores: Scores;
  rawScores: RawScores;
} {
  const rawScores = calculateRawScores(answers);
  const scores = calculatePercentages(rawScores);
  const mbtiType = determineMBTIType(scores);

  return { mbtiType, scores, rawScores };
}
