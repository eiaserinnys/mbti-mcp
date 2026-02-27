/**
 * MBTI MCP Server Entry Point
 *
 * Phase 1: 기본 구조만 생성 (실제 MCP 서버 구현은 Phase 2)
 */

import { questions, getQuestion, answerInstruction } from './data/questions.js';
import { typeDescriptions, getTypeDescription } from './data/descriptions.js';
import type { MBTIType } from './types.js';

// 기본 검증: 데이터가 올바르게 로드되었는지 확인
console.log('MBTI MCP Server - Phase 1 Data Validation');
console.log('==========================================');
console.log(`총 문항 수: ${questions.length}개`);
console.log(`총 유형 수: ${Object.keys(typeDescriptions).length}개`);

// 문항 샘플 출력
const sampleQuestion = getQuestion(1);
if (sampleQuestion) {
  console.log('\n첫 번째 문항 예시:');
  console.log(`  ${sampleQuestion.optionA} vs ${sampleQuestion.optionB}`);
  console.log(`  차원: ${sampleQuestion.dimension}`);
}

// 유형 설명 샘플 출력
const sampleType: MBTIType = 'INTP';
const sampleDesc = getTypeDescription(sampleType);
console.log(`\n${sampleType} 유형 예시:`);
console.log(`  별명: ${sampleDesc.title}`);
console.log(`  설명: ${sampleDesc.description.slice(0, 50)}...`);

console.log('\n답변 안내:');
console.log(answerInstruction);

console.log('\n✅ Phase 1 데이터 준비 완료!');
