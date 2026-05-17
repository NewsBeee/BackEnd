const db = require("../db");

// 이번 주 챌린지 생성
exports.createChallenge = async (userId, weekStart, category, goal) => {
  const [rows] = await db.query(
    "INSERT INTO Challenge (user_id, week_start, category, goal) VALUES (?, ?, ?, ?)",
    [userId, weekStart, category, goal],
  );
  return rows;
};

// 특정 사용자의 특정 주차 챌린지 조회
exports.findChallengeByWeekStart = async (userId, weekStart) => {
  const [rows] = await db.query(
    "SELECT * FROM Challenge WHERE user_id = ? AND week_start = ?",
    [userId, weekStart],
  );
  return rows[0];
};

// 가장 최근 챌린지 조회
exports.findCurrentChallenge = async (userId) => {
  const [rows] = await db.query(
    "SELECT * FROM Challenge WHERE user_id = ? ORDER BY week_start DESC LIMIT 1",
    [userId],
  );
  return rows[0];
};

// 챌린지 성공 여부 업데이트
exports.updateChallengeSuccess = async (challengeId, isSuccess) => {
  const [rows] = await db.query(
    "UPDATE Challenge SET is_success = ? WHERE challenge_id = ?",
    [isSuccess, challengeId],
  );
  return rows;
};

// User.total_success 업데이트
exports.updateUserTotalSuccess = async (userId) => {
  const [rows] = await db.query(
    `UPDATE User
     SET total_success = (
       SELECT COUNT(*)
       FROM Challenge
       WHERE user_id = ? AND is_success = true
     )
     WHERE user_id = ?`,
    [userId, userId],
  );
  return rows;
};

// 사용자 정보 조회
exports.findUserById = async (userId) => {
  const [rows] = await db.query("SELECT * FROM User WHERE user_id = ?", [userId]);
  return rows[0];
};

// 전체 읽은 기사 수 조회
exports.countReadArticles = async (userId) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS readArticleCount FROM Reading_log WHERE user_id = ?",
    [userId],
  );
  return rows[0];
};

// 이번 주 읽기 기록 체크용: 카테고리 상관없이 읽은 기사 조회
exports.findWeeklyReadingLogs = async (userId, weekStart, weekEnd) => {
  const [rows] = await db.query(
    `SELECT read_date, article_id
     FROM Reading_log
     WHERE user_id = ?
       AND read_date BETWEEN ? AND ?`,
    [userId, weekStart, weekEnd],
  );
  return rows;
};

// 챌린지 목표 달성 계산용: 챌린지 카테고리와 같은 기사만 조회
exports.findWeeklyChallengeLogs = async (userId, weekStart, weekEnd, category) => {
  const [rows] = await db.query(
    `SELECT rl.read_date, a.article_id
     FROM Reading_log rl
     JOIN Article a ON rl.article_id = a.article_id
     WHERE rl.user_id = ?
       AND rl.read_date BETWEEN ? AND ?
       AND a.category = ?`,
    [userId, weekStart, weekEnd, category],
  );
  return rows;
};

// 완료한 주 수 조회
exports.countCompletedWeeks = async (userId) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS completedWeekCount FROM Challenge WHERE user_id = ? AND is_success = true",
    [userId],
  );
  return rows[0];
};