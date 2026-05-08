const axios = require("axios");
const db = require("../db");
const AI_SERVER_URL = process.env.AI_SERVER_URL;

// 온보딩 퀴즈 시작
exports.startOnboardingQuiz = async (userId) => {
  const response = await axios.post(`${AI_SERVER_URL}/api/quiz/start`, {
    user_id: String(userId),
    quiz_type: "onboarding",
    current_grade: null,
  });

  return response.data;
};

// 온보딩 답변 제출
exports.submitOnboardingAnswer = async (sessionId, choiceId) => {
  const response = await axios.post(`${AI_SERVER_URL}/api/quiz/answer`, {
    session_id: sessionId,
    choiceId,
  });

  return response.data;
};

// 온보딩 완료 후 사용자 레벨 업데이트
exports.updateUserLevel = async (userId, level) => {
  const [rows] = await db.query(
    "UPDATE User SET level = ? WHERE user_id = ?",
    [level, userId],
  );

  return rows;
};