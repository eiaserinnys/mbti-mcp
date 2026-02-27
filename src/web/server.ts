/**
 * MBTI 웹 서버
 *
 * Express 서버로 REST API와 정적 파일을 제공합니다.
 * MCP 서버와 동일한 비즈니스 로직을 공유합니다.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDatabase, closeDatabase } from '../db/sqlite.js';
import { createRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수
const PORT = parseInt(process.env.MBTI_WEB_PORT || '3000', 10);
const DB_PATH = process.env.MBTI_DB_PATH || 'data/mbti.db';

const app = express();

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP 추출 (프록시 뒤에서 동작 시)
app.set('trust proxy', true);

// 정적 파일 서빙
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API 라우트
app.use('/api', createRoutes());

// SPA fallback - 모든 GET 요청을 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 서버 시작
async function main() {
  // 데이터 디렉토리 확인/생성
  const fs = await import('fs');
  const dbDir = path.dirname(DB_PATH);
  if (dbDir && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 데이터베이스 초기화
  initDatabase(DB_PATH);

  // 종료 핸들러
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    closeDatabase();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    closeDatabase();
    process.exit(0);
  });

  // 서버 시작
  app.listen(PORT, () => {
    console.log(`MBTI Web Server started on http://localhost:${PORT}`);
    console.log(`Database: ${DB_PATH}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
