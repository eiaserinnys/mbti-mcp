/**
 * MBTI 테스트 문항 (32개)
 *
 * 출처: Open Extended Jungian Type Scales (OEJTS) 1.2
 * 라이선스: CC BY-NC-SA 4.0
 * https://openpsychometrics.org/tests/OJTS/
 *
 * 한국어 번역: Dorothy (AI Assistant)
 */

import type { Question, MBTIDimension } from '../types.js';

/**
 * 32개 문항 데이터
 *
 * scoring:
 *   - 'A': 1에 가까울수록 첫 글자 (E, S, T, J)
 *   - 'B': 1에 가까울수록 둘째 글자 (I, N, F, P)
 *
 * 답변 척도 (1-5):
 *   1: 선택지 A에 매우 가까움
 *   2: 선택지 A에 약간 가까움
 *   3: 중립 / 둘 다 비슷함
 *   4: 선택지 B에 약간 가까움
 *   5: 선택지 B에 매우 가까움
 */
export const questions: Question[] = [
  // === E/I (외향/내향) 문항 1-8 ===
  {
    number: 1,
    optionA: '활기찬',
    optionB: '차분한',
    optionAEn: 'energetic',
    optionBEn: 'mellow',
    dimension: 'EI',
    scoring: 'A',
  },
  {
    number: 2,
    optionA: '혼자 일할 때 최선',
    optionB: '함께 일할 때 최선',
    optionAEn: 'works best alone',
    optionBEn: 'works best in groups',
    dimension: 'EI',
    scoring: 'B',
  },
  {
    number: 3,
    optionA: '사교적인',
    optionB: '조용한',
    optionAEn: 'talkative',
    optionBEn: 'quiet',
    dimension: 'EI',
    scoring: 'A',
  },
  {
    number: 4,
    optionA: '내성적인',
    optionB: '외향적인',
    optionAEn: 'introverted',
    optionBEn: 'extroverted',
    dimension: 'EI',
    scoring: 'B',
  },
  {
    number: 5,
    optionA: '파티의 중심',
    optionB: '파티의 관찰자',
    optionAEn: 'life of the party',
    optionBEn: 'wallflower',
    dimension: 'EI',
    scoring: 'A',
  },
  {
    number: 6,
    optionA: '사적인',
    optionB: '개방적인',
    optionAEn: 'private',
    optionBEn: 'open',
    dimension: 'EI',
    scoring: 'B',
  },
  {
    number: 7,
    optionA: '사람들과 어울리면 에너지가 생김',
    optionB: '혼자 있으면 에너지가 생김',
    optionAEn: 'energized by people',
    optionBEn: 'energized by solitude',
    dimension: 'EI',
    scoring: 'A',
  },
  {
    number: 8,
    optionA: '속마음을 잘 드러냄',
    optionB: '속마음을 잘 숨김',
    optionAEn: 'expressive',
    optionBEn: 'reserved',
    dimension: 'EI',
    scoring: 'A',
  },

  // === S/N (감각/직관) 문항 9-16 ===
  {
    number: 9,
    optionA: '큰 그림을 봄',
    optionB: '세부사항에 집중',
    optionAEn: 'wants the big picture',
    optionBEn: 'wants the details',
    dimension: 'SN',
    scoring: 'B',
  },
  {
    number: 10,
    optionA: '현재에 집중',
    optionB: '미래에 집중',
    optionAEn: 'focused on the present',
    optionBEn: 'focused on the future',
    dimension: 'SN',
    scoring: 'A',
  },
  {
    number: 11,
    optionA: '현실적인',
    optionB: '상상력이 풍부한',
    optionAEn: 'realistic',
    optionBEn: 'imaginative',
    dimension: 'SN',
    scoring: 'A',
  },
  {
    number: 12,
    optionA: '추상적인',
    optionB: '구체적인',
    optionAEn: 'abstract',
    optionBEn: 'concrete',
    dimension: 'SN',
    scoring: 'B',
  },
  {
    number: 13,
    optionA: '경험에 의존',
    optionB: '직감에 의존',
    optionAEn: 'relies on experience',
    optionBEn: 'relies on intuition',
    dimension: 'SN',
    scoring: 'A',
  },
  {
    number: 14,
    optionA: '이론적인',
    optionB: '실용적인',
    optionAEn: 'theoretical',
    optionBEn: 'practical',
    dimension: 'SN',
    scoring: 'B',
  },
  {
    number: 15,
    optionA: '전통을 중시',
    optionB: '새로움을 추구',
    optionAEn: 'conventional',
    optionBEn: 'unconventional',
    dimension: 'SN',
    scoring: 'A',
  },
  {
    number: 16,
    optionA: '가능성을 탐색',
    optionB: '사실을 확인',
    optionAEn: 'explores possibilities',
    optionBEn: 'focuses on facts',
    dimension: 'SN',
    scoring: 'B',
  },

  // === T/F (사고/감정) 문항 17-24 ===
  {
    number: 17,
    optionA: '회의적인',
    optionB: '믿고 싶어하는',
    optionAEn: 'skeptical',
    optionBEn: 'wants to believe',
    dimension: 'TF',
    scoring: 'A',
  },
  {
    number: 18,
    optionA: '마음을 따름',
    optionB: '머리를 따름',
    optionAEn: 'follows the heart',
    optionBEn: 'follows the head',
    dimension: 'TF',
    scoring: 'B',
  },
  {
    number: 19,
    optionA: '공정함을 중시',
    optionB: '조화를 중시',
    optionAEn: 'values fairness',
    optionBEn: 'values harmony',
    dimension: 'TF',
    scoring: 'A',
  },
  {
    number: 20,
    optionA: '공감하는',
    optionB: '분석적인',
    optionAEn: 'empathetic',
    optionBEn: 'analytical',
    dimension: 'TF',
    scoring: 'B',
  },
  {
    number: 21,
    optionA: '논리를 우선',
    optionB: '감정을 우선',
    optionAEn: 'logic first',
    optionBEn: 'feelings first',
    dimension: 'TF',
    scoring: 'A',
  },
  {
    number: 22,
    optionA: '따뜻한',
    optionB: '냉정한',
    optionAEn: 'warm',
    optionBEn: 'cool',
    dimension: 'TF',
    scoring: 'B',
  },
  {
    number: 23,
    optionA: '객관적인',
    optionB: '주관적인',
    optionAEn: 'objective',
    optionBEn: 'subjective',
    dimension: 'TF',
    scoring: 'A',
  },
  {
    number: 24,
    optionA: '다정한',
    optionB: '단호한',
    optionAEn: 'tender',
    optionBEn: 'tough',
    dimension: 'TF',
    scoring: 'B',
  },

  // === J/P (판단/인식) 문항 25-32 ===
  {
    number: 25,
    optionA: '정리된',
    optionB: '혼란스러운',
    optionAEn: 'organized',
    optionBEn: 'chaotic',
    dimension: 'JP',
    scoring: 'A',
  },
  {
    number: 26,
    optionA: '준비하는',
    optionB: '즉흥적인',
    optionAEn: 'prepares',
    optionBEn: 'improvises',
    dimension: 'JP',
    scoring: 'A',
  },
  {
    number: 27,
    optionA: '목록을 만듦',
    optionB: '기억에 의존',
    optionAEn: 'makes lists',
    optionBEn: 'relies on memory',
    dimension: 'JP',
    scoring: 'A',
  },
  {
    number: 28,
    optionA: '자발적인',
    optionB: '계획적인',
    optionAEn: 'spontaneous',
    optionBEn: 'scheduled',
    dimension: 'JP',
    scoring: 'B',
  },
  {
    number: 29,
    optionA: '체계적인',
    optionB: '유연한',
    optionAEn: 'systematic',
    optionBEn: 'flexible',
    dimension: 'JP',
    scoring: 'A',
  },
  {
    number: 30,
    optionA: '마감을 지킴',
    optionB: '마감에 쫓김',
    optionAEn: 'meets deadlines',
    optionBEn: 'chases deadlines',
    dimension: 'JP',
    scoring: 'A',
  },
  {
    number: 31,
    optionA: '결정을 미룸',
    optionB: '빨리 결정함',
    optionAEn: 'postpones decisions',
    optionBEn: 'decides quickly',
    dimension: 'JP',
    scoring: 'B',
  },
  {
    number: 32,
    optionA: '규칙을 따름',
    optionB: '상황에 맞게',
    optionAEn: 'follows rules',
    optionBEn: 'adapts to situations',
    dimension: 'JP',
    scoring: 'A',
  },
];

/**
 * 문항 번호로 문항 조회
 */
export function getQuestion(questionNumber: number): Question | undefined {
  return questions.find((q) => q.number === questionNumber);
}

/**
 * 차원별 문항 조회
 */
export function getQuestionsByDimension(dimension: MBTIDimension): Question[] {
  return questions.filter((q) => q.dimension === dimension);
}

/**
 * 차원 표시 문자열 반환
 */
export function getDimensionLabel(dimension: MBTIDimension): string {
  const labels: Record<MBTIDimension, string> = {
    EI: 'E/I (외향/내향)',
    SN: 'S/N (감각/직관)',
    TF: 'T/F (사고/감정)',
    JP: 'J/P (판단/인식)',
  };
  return labels[dimension];
}

/**
 * 답변 안내 문구
 */
export const answerInstruction = `1-5 사이의 숫자로 답변해 주세요.

1: 선택지 A에 매우 가까움
2: 선택지 A에 약간 가까움
3: 둘 다 비슷함 (중립)
4: 선택지 B에 약간 가까움
5: 선택지 B에 매우 가까움`;
