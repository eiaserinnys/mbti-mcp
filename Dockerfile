# MBTI MCP Server Dockerfile
# HTTP Streaming MCP 서버 + 웹 서버

FROM node:22-slim AS builder

# 빌드 도구 설치 (better-sqlite3 네이티브 모듈 빌드용)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 복사 및 빌드
COPY tsconfig.json ./
COPY src/ ./src/

# TypeScript 빌드 + public 파일 복사
RUN npm run build

# ===================
# Production stage
# ===================
FROM node:22-slim

# 로케일 설정 (한국어 지원)
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# 런타임 의존성 설치 (healthcheck용 wget)
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 데이터 디렉토리 생성
RUN mkdir -p /app/data

# 환경 변수
ENV NODE_ENV=production
ENV MBTI_DB_PATH=/app/data/mbti.db
ENV MBTI_MCP_PORT=8004
ENV MBTI_WEB_PORT=3000

# 포트 노출
# 8004: MCP HTTP (Streamable HTTP)
# 3000: 웹 UI
EXPOSE 8004 3000

# 기본 커맨드 (HTTP MCP 서버)
# docker-compose에서 오버라이드 가능
CMD ["node", "dist/http-server.js"]
