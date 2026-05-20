const axios = require("axios");
const db = require("../db");
const AI_SERVER_URL = process.env.AI_SERVER_URL;

// 사용자 정보 조회
exports.findUserById = async (userId) => {
  const [rows] = await db.query("SELECT * FROM User WHERE user_id = ?", [
    userId,
  ]);
  return rows[0];
};

// 승급 퀴즈 시작
exports.startPromotionQuiz = async (userId, currentGrade) => {
  const response = await axios.post(`${AI_SERVER_URL}/api/quiz/start`, {
    user_id: String(userId),
    quiz_type: "upgrade",
    current_grade: currentGrade,
  });

  return response.data;
};

// 승급 퀴즈 답변 제출
exports.submitPromotionAnswer = async (sessionId, choiceId) => {
  const response = await axios.post(`${AI_SERVER_URL}/api/quiz/answer`, {
    session_id: sessionId,
    choiceId,
  });

  return response.data;
};

// 사용자 레벨 업데이트
exports.updateUserLevel = async (userId, level) => {
  const [rows] = await db.query(
    "UPDATE User SET level = ? WHERE user_id = ?",
    [level, userId],
  );

  return rows;
};

// 승급퀴즈에 사용한 챌린지 도장 소모 처리
exports.markChallengesUsedForPromotion = async (userId) => {
  const [rows] = await db.query(
    `UPDATE Challenge
     SET used_for_promotion = true
     WHERE user_id = ?
       AND is_success = true
       AND used_for_promotion = false`,
    [userId],
  );

  return rows;
};

// 사용하지 않은 챌린지 도장 개수로 total_success 재계산
exports.updateUserTotalSuccess = async (userId) => {
  const [rows] = await db.query(
    `UPDATE User
     SET total_success = (
       SELECT COUNT(*)
       FROM Challenge
       WHERE user_id = ?
         AND is_success = true
         AND used_for_promotion = false
     )
     WHERE user_id = ?`,
    [userId, userId],
  );

  return rows;
};