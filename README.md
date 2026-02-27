# MBTI MCP Server

에이전트들이 MBTI 성격 유형 테스트를 할 수 있는 MCP 서버입니다.

## Quick Start

Claude Code의 MCP 설정 파일(`.mcp.json`)에 다음을 추가:

```json
{
  "mcpServers": {
    "mbti-mcp": {
      "type": "streamable-http",
      "url": "https://eiaserinnys.me/mcp/mbti/"
    }
  }
}
```

> **참고**: 설정 후 Claude Code 재시작 필요

## Self-Hosting (Docker)

```bash
# 레포지토리 클론
git clone https://github.com/eiaserinnys/mbti-mcp.git
cd mbti-mcp

# Docker 이미지 빌드
docker build -t mbti-mcp:latest .

# MCP 서버 실행 (Streamable HTTP)
docker run -d \
  --name mcp-mbti \
  -v mbti-data:/app/data \
  --network host \
  mbti-mcp:latest \
  npx supergateway --stdio 'node dist/index.js' --port 8004 \
    --healthEndpoint /health \
    --outputTransport streamableHttp \
    --streamableHttpPath /mcp

# 웹 UI 실행 (선택)
docker run -d \
  --name mbti-web \
  -v mbti-data:/app/data \
  -e MBTI_WEB_PORT=8005 \
  --network host \
  mbti-mcp:latest \
  node dist/web/server.js
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `start_test` | 새 MBTI 테스트 세션 시작 |
| `get_question` | 현재 또는 특정 문항 조회 |
| `answer_question` | 문항에 답변 (1-5 척도) |
| `get_result` | 완료된 테스트 결과 조회 |
| `lookup_result` | 이전 테스트 결과 검색 |
| `get_session_status` | 세션 상태 확인 |

## Usage Example

```
# 테스트 시작
mcp__mbti-mcp__start_test(name: "도로시")
→ { session_id: "abc-123", message: "테스트를 시작합니다!" }

# 문항 조회
mcp__mbti-mcp__get_question(session_id: "abc-123")
→ { question_number: 1, option_a: "활기찬", option_b: "차분한" }

# 답변 (1=A에 매우 가까움, 3=중립, 5=B에 매우 가까움)
mcp__mbti-mcp__answer_question(session_id: "abc-123", question_number: 1, answer: 2)
→ { progress: "1/32" }

# ... 32문항 반복 ...

# 결과 조회
mcp__mbti-mcp__get_result(session_id: "abc-123")
→ { mbti_type: "ENFJ", scores: {...}, description: "선도자: ..." }
```

## Ports

| Service | Port | Description |
|---------|------|-------------|
| MCP Streamable HTTP | 8004 | MCP 프로토콜 (엔드포인트: `/mcp`) |
| Web UI | 8005 | 웹 브라우저용 테스트 UI |

## Question Source

[Open Extended Jungian Type Scales (OEJTS) 1.2](https://openpsychometrics.org/tests/OJTS/)
- 32문항 (각 4개 척도당 8문항)

## License

CC BY-NC-SA 4.0 (비상업적 용도만 사용 가능)
