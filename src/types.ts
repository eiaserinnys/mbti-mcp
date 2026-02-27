/**
 * MBTI MCP Server Type Definitions
 */

// MBTI 차원 (Dimension)
export type MBTIDimension = 'EI' | 'SN' | 'TF' | 'JP';

// MBTI 특성 (Trait)
export type MBTITrait = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// MBTI 유형 (16가지)
export type MBTIType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

// 문항 구조
export interface Question {
  number: number;           // 문항 번호 (1-32)
  optionA: string;          // 선택지 A (한국어)
  optionB: string;          // 선택지 B (한국어)
  optionAEn: string;        // 선택지 A (영어 원문)
  optionBEn: string;        // 선택지 B (영어 원문)
  dimension: MBTIDimension; // 측정 차원
  scoring: 'A' | 'B';       // A=첫 글자(E,S,T,J), B=둘째 글자(I,N,F,P)
}

// 답변 (1-5 척도)
export interface Answer {
  questionNumber: number;
  answer: 1 | 2 | 3 | 4 | 5;  // 1=A에 가까움, 5=B에 가까움, 3=중립
}

// 세션 상태
export type SessionStatus = 'in_progress' | 'completed' | 'expired';

// 세션 정보
export interface Session {
  id: string;               // UUID
  name: string;             // 테스트 참여자 이름
  agentId?: string;         // 선택적 에이전트 식별자
  status: SessionStatus;
  currentQuestion: number;  // 현재 문항 번호 (1-32)
  createdAt: string;        // ISO 8601
  completedAt?: string;     // ISO 8601
}

// 점수 (백분율)
export interface Scores {
  E: number; I: number;
  S: number; N: number;
  T: number; F: number;
  J: number; P: number;
}

// 원시 점수 (계산용)
export interface RawScores {
  E: number; I: number;
  S: number; N: number;
  T: number; F: number;
  J: number; P: number;
}

// 테스트 결과
export interface MBTIResult {
  sessionId: string;
  name: string;
  mbtiType: MBTIType;
  scores: Scores;
  description: string;      // 유형 설명 (한국어)
  completedAt: string;      // ISO 8601
}

// 유형 설명
export interface TypeDescription {
  type: MBTIType;
  title: string;            // 별명 (예: "논리적인 사색가")
  description: string;      // 상세 설명
  strengths: string[];      // 강점
  weaknesses: string[];     // 약점
}

// Tool 응답 타입들

export interface StartTestResponse {
  session_id: string;
  name: string;
  total_questions: 32;
  message: string;
}

export interface GetQuestionResponse {
  question_number: number;
  total_questions: 32;
  option_a: string;
  option_b: string;
  scale: string;
  instruction: string;
}

export interface AnswerQuestionResponse {
  accepted: boolean;
  question_number: number;
  next_question: number | null;
  progress: string;
}

export interface GetResultResponse {
  name: string;
  mbti_type: string;
  scores: Scores;
  description: string;
  completed_at: string;
}

export interface LookupResultResponse {
  results: Array<{
    session_id: string;
    name: string;
    mbti_type: string;
    completed_at: string;
  }>;
}

export interface GetSessionStatusResponse {
  session_id: string;
  name: string;
  status: SessionStatus;
  current_question: number;
  answers_count: number;
}
