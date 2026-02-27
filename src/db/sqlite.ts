/**
 * SQLite 데이터베이스 관리
 *
 * 테이블:
 * - sessions: 테스트 세션 정보
 * - answers: 각 문항 답변
 * - results: 완료된 테스트 결과
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { SessionStatus, Answer, MBTIType, Scores } from '../types.js';

// 데이터베이스 인스턴스
let db: Database.Database | null = null;

/**
 * 데이터베이스 초기화
 *
 * @param dbPath - 데이터베이스 파일 경로 (기본: data/mbti.db)
 */
export function initDatabase(dbPath: string = 'data/mbti.db'): Database.Database {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // 테이블 생성
  db.exec(`
    -- 세션 테이블
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      agent_id TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      current_question INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- 답변 테이블
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_number INTEGER NOT NULL,
      answer INTEGER NOT NULL CHECK (answer BETWEEN 1 AND 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE (session_id, question_number)
    );

    -- 결과 테이블
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      mbti_type TEXT NOT NULL,
      scores_json TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    -- 인덱스
    CREATE INDEX IF NOT EXISTS idx_sessions_name ON sessions(name);
    CREATE INDEX IF NOT EXISTS idx_sessions_agent_id ON sessions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_answers_session_id ON answers(session_id);
    CREATE INDEX IF NOT EXISTS idx_results_name ON results(name);
  `);

  return db;
}

/**
 * 데이터베이스 연결 반환
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 테스트용 데이터베이스 초기화 (메모리 DB)
 */
export function initTestDatabase(): Database.Database {
  return initDatabase(':memory:');
}

// ==================== Session CRUD ====================

export interface SessionRow {
  id: string;
  name: string;
  agent_id: string | null;
  status: SessionStatus;
  current_question: number;
  created_at: string;
  completed_at: string | null;
}

/**
 * 새 세션 생성
 */
export function createSession(name: string, agentId?: string): SessionRow {
  const db = getDatabase();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO sessions (id, name, agent_id)
    VALUES (?, ?, ?)
  `).run(id, name, agentId ?? null);

  return getSession(id)!;
}

/**
 * 세션 조회
 */
export function getSession(sessionId: string): SessionRow | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(sessionId) as SessionRow | undefined;
  return row ?? null;
}

/**
 * 세션 상태 업데이트
 */
export function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  completedAt?: string
): void {
  const db = getDatabase();
  if (completedAt) {
    db.prepare(`
      UPDATE sessions SET status = ?, completed_at = ? WHERE id = ?
    `).run(status, completedAt, sessionId);
  } else {
    db.prepare(`
      UPDATE sessions SET status = ? WHERE id = ?
    `).run(status, sessionId);
  }
}

/**
 * 현재 문항 번호 업데이트
 */
export function updateCurrentQuestion(
  sessionId: string,
  questionNumber: number
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE sessions SET current_question = ? WHERE id = ?
  `).run(questionNumber, sessionId);
}

// ==================== Answer CRUD ====================

export interface AnswerRow {
  id: number;
  session_id: string;
  question_number: number;
  answer: number;
  created_at: string;
}

/**
 * 답변 저장 (기존 답변 덮어쓰기)
 */
export function saveAnswer(
  sessionId: string,
  questionNumber: number,
  answer: 1 | 2 | 3 | 4 | 5
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO answers (session_id, question_number, answer)
    VALUES (?, ?, ?)
  `).run(sessionId, questionNumber, answer);
}

/**
 * 세션의 모든 답변 조회
 */
export function getAnswers(sessionId: string): Answer[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT question_number, answer FROM answers WHERE session_id = ? ORDER BY question_number'
    )
    .all(sessionId) as Array<{ question_number: number; answer: number }>;

  return rows.map((row) => ({
    questionNumber: row.question_number,
    answer: row.answer as 1 | 2 | 3 | 4 | 5,
  }));
}

/**
 * 세션의 답변 수 조회
 */
export function getAnswerCount(sessionId: string): number {
  const db = getDatabase();
  const result = db
    .prepare('SELECT COUNT(*) as count FROM answers WHERE session_id = ?')
    .get(sessionId) as { count: number };
  return result.count;
}

// ==================== Result CRUD ====================

export interface ResultRow {
  id: number;
  session_id: string;
  name: string;
  mbti_type: MBTIType;
  scores_json: string;
  completed_at: string;
}

/**
 * 결과 저장
 */
export function saveResult(
  sessionId: string,
  name: string,
  mbtiType: MBTIType,
  scores: Scores
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO results (session_id, name, mbti_type, scores_json)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, name, mbtiType, JSON.stringify(scores));
}

/**
 * 세션 ID로 결과 조회
 */
export function getResult(sessionId: string): ResultRow | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM results WHERE session_id = ?')
    .get(sessionId) as ResultRow | undefined;
  return row ?? null;
}

/**
 * 이름으로 결과 검색
 */
export function findResultsByName(name: string): ResultRow[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT * FROM results WHERE name LIKE ? ORDER BY completed_at DESC'
    )
    .all(`%${name}%`) as ResultRow[];
  return rows;
}

/**
 * 최근 결과 조회
 */
export function getRecentResults(limit: number = 10): ResultRow[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM results ORDER BY completed_at DESC LIMIT ?')
    .all(limit) as ResultRow[];
  return rows;
}
