const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

//기본 미들웨어 설정

// CORS 설정 (프론트 연결용)
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })
);

// JSON 요청 파싱
app.use(express.json());

//기본 라우트 (테스트용)
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'NewsBee BackEnd Server Running',
  });
});

//라우터 연결 (나중에 추가)

// 404 처리
app.use((req, res, next) => {
  res.status(404).json({
    message: '요청한 경로를 찾을 수 없습니다.',
  });
});

//에러 처리
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(err.status || 500).json({
    message: err.message || '서버 내부 오류',
  });
});

//서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});