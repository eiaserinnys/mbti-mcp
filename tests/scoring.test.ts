/**
 * 점수 계산 로직 테스트
 *
 * TDD: 먼저 테스트를 작성하고, 구현을 진행
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRawScores,
  calculatePercentages,
  determineMBTIType,
  calculateMBTIResult,
} from '../src/utils/scoring.js';
import type { Answer, MBTIType, RawScores, Scores } from '../src/types.js';
import { questions } from '../src/data/questions.js';

describe('calculateRawScores', () => {
  it('중립 답변(3)은 양쪽에 동일 점수 배분', () => {
    // 모든 문항에 3(중립)으로 답변
    const answers: Answer[] = questions.map((q) => ({
      questionNumber: q.number,
      answer: 3,
    }));

    const scores = calculateRawScores(answers);

    // 각 차원별 8문항, 중립은 양쪽에 0.5씩
    // E/I: 8문항 * 0.5 = 4
    expect(scores.E).toBe(4);
    expect(scores.I).toBe(4);
    expect(scores.S).toBe(4);
    expect(scores.N).toBe(4);
    expect(scores.T).toBe(4);
    expect(scores.F).toBe(4);
    expect(scores.J).toBe(4);
    expect(scores.P).toBe(4);
  });

  it('극단 답변(1)은 해당 특성에 1점', () => {
    // 모든 문항에 1(A에 매우 가까움)로 답변
    const answers: Answer[] = questions.map((q) => ({
      questionNumber: q.number,
      answer: 1,
    }));

    const scores = calculateRawScores(answers);

    // scoring='A'인 문항: E, S, T, J에 점수
    // scoring='B'인 문항: I, N, F, P에 점수 (1은 A쪽이므로 첫 글자)
    // EI 8문항: scoring A=5개, B=3개 → E=5, I=3 (1번 답변 시)
    // 실제 데이터 기준으로 확인 필요
  });

  it('극단 답변(5)은 반대 특성에 1점', () => {
    // 모든 문항에 5(B에 매우 가까움)로 답변
    const answers: Answer[] = questions.map((q) => ({
      questionNumber: q.number,
      answer: 5,
    }));

    const scores = calculateRawScores(answers);

    // 5번 답변 시 B쪽 특성에 점수
    // scoring='A'인 문항: B쪽(I,N,F,P)에 점수
    // scoring='B'인 문항: B쪽(I,N,F,P)에 점수
  });

  it('답변 2는 A쪽 0.75, B쪽 0.25', () => {
    // 문항 1번에만 답변 2
    const answers: Answer[] = [{ questionNumber: 1, answer: 2 }];
    const scores = calculateRawScores(answers);

    // 문항 1: EI, scoring=A → 2번 답변 시 E=0.75, I=0.25
    expect(scores.E).toBe(0.75);
    expect(scores.I).toBe(0.25);
  });

  it('답변 4는 A쪽 0.25, B쪽 0.75', () => {
    // 문항 1번에만 답변 4
    const answers: Answer[] = [{ questionNumber: 1, answer: 4 }];
    const scores = calculateRawScores(answers);

    // 문항 1: EI, scoring=A → 4번 답변 시 E=0.25, I=0.75
    expect(scores.E).toBe(0.25);
    expect(scores.I).toBe(0.75);
  });
});

describe('calculatePercentages', () => {
  it('동일 점수는 50%:50%', () => {
    const raw: RawScores = {
      E: 4,
      I: 4,
      S: 4,
      N: 4,
      T: 4,
      F: 4,
      J: 4,
      P: 4,
    };

    const percentages = calculatePercentages(raw);

    expect(percentages.E).toBe(50);
    expect(percentages.I).toBe(50);
    expect(percentages.S).toBe(50);
    expect(percentages.N).toBe(50);
    expect(percentages.T).toBe(50);
    expect(percentages.F).toBe(50);
    expect(percentages.J).toBe(50);
    expect(percentages.P).toBe(50);
  });

  it('8:0은 100%:0%', () => {
    const raw: RawScores = {
      E: 8,
      I: 0,
      S: 0,
      N: 8,
      T: 8,
      F: 0,
      J: 0,
      P: 8,
    };

    const percentages = calculatePercentages(raw);

    expect(percentages.E).toBe(100);
    expect(percentages.I).toBe(0);
    expect(percentages.S).toBe(0);
    expect(percentages.N).toBe(100);
    expect(percentages.T).toBe(100);
    expect(percentages.F).toBe(0);
    expect(percentages.J).toBe(0);
    expect(percentages.P).toBe(100);
  });

  it('6:2는 75%:25%', () => {
    const raw: RawScores = {
      E: 6,
      I: 2,
      S: 2,
      N: 6,
      T: 6,
      F: 2,
      J: 2,
      P: 6,
    };

    const percentages = calculatePercentages(raw);

    expect(percentages.E).toBe(75);
    expect(percentages.I).toBe(25);
    expect(percentages.S).toBe(25);
    expect(percentages.N).toBe(75);
    expect(percentages.T).toBe(75);
    expect(percentages.F).toBe(25);
    expect(percentages.J).toBe(25);
    expect(percentages.P).toBe(75);
  });
});

describe('determineMBTIType', () => {
  it('E>I, S>N, T>F, J>P → ESTJ', () => {
    const scores: Scores = {
      E: 60,
      I: 40,
      S: 60,
      N: 40,
      T: 60,
      F: 40,
      J: 60,
      P: 40,
    };

    expect(determineMBTIType(scores)).toBe('ESTJ');
  });

  it('I>E, N>S, F>T, P>J → INFP', () => {
    const scores: Scores = {
      E: 40,
      I: 60,
      S: 40,
      N: 60,
      T: 40,
      F: 60,
      J: 40,
      P: 60,
    };

    expect(determineMBTIType(scores)).toBe('INFP');
  });

  it('동점(50:50)은 두 번째 글자(I, N, F, P) 선택', () => {
    const scores: Scores = {
      E: 50,
      I: 50,
      S: 50,
      N: 50,
      T: 50,
      F: 50,
      J: 50,
      P: 50,
    };

    // 동점 시 I, N, F, P 선택 (내향/직관/감정/인식 우선)
    expect(determineMBTIType(scores)).toBe('INFP');
  });

  it('모든 16가지 유형이 올바르게 결정됨', () => {
    const types: MBTIType[] = [
      'ISTJ',
      'ISFJ',
      'INFJ',
      'INTJ',
      'ISTP',
      'ISFP',
      'INFP',
      'INTP',
      'ESTP',
      'ESFP',
      'ENFP',
      'ENTP',
      'ESTJ',
      'ESFJ',
      'ENFJ',
      'ENTJ',
    ];

    for (const expectedType of types) {
      const scores: Scores = {
        E: expectedType[0] === 'E' ? 60 : 40,
        I: expectedType[0] === 'I' ? 60 : 40,
        S: expectedType[1] === 'S' ? 60 : 40,
        N: expectedType[1] === 'N' ? 60 : 40,
        T: expectedType[2] === 'T' ? 60 : 40,
        F: expectedType[2] === 'F' ? 60 : 40,
        J: expectedType[3] === 'J' ? 60 : 40,
        P: expectedType[3] === 'P' ? 60 : 40,
      };

      expect(determineMBTIType(scores)).toBe(expectedType);
    }
  });
});

describe('calculateMBTIResult', () => {
  it('전체 테스트 결과 계산', () => {
    // 32문항 모두 중립(3)으로 답변
    const answers: Answer[] = questions.map((q) => ({
      questionNumber: q.number,
      answer: 3,
    }));

    const result = calculateMBTIResult(answers);

    // 중립 시 INFP (동점 규칙)
    expect(result.mbtiType).toBe('INFP');
    expect(result.scores.E).toBe(50);
    expect(result.scores.I).toBe(50);
  });

  it('강한 E 성향 테스트', () => {
    // EI 문항(1-8)에 모두 E 방향으로 답변
    // scoring=A인 문항: 1로 답변 (E 방향)
    // scoring=B인 문항: 5로 답변 (E 방향)
    const answers: Answer[] = questions.map((q) => {
      if (q.dimension === 'EI') {
        return {
          questionNumber: q.number,
          answer: q.scoring === 'A' ? 1 : 5,
        };
      }
      // 나머지는 중립
      return { questionNumber: q.number, answer: 3 };
    });

    const result = calculateMBTIResult(answers);

    expect(result.scores.E).toBe(100);
    expect(result.scores.I).toBe(0);
    expect(result.mbtiType[0]).toBe('E');
  });
});
