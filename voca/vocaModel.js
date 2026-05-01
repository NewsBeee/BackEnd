const db = require("../db");

// user_id랑 word 기준 기존 단어 조회
exports.findVocabularyByWord = async (userId, word) => {
  const [rows] = await db.query(
    "SELECT * FROM Voca WHERE user_id = ? AND word = ?",
    [userId, word],
  );
  return rows[0];
};

// 기사 내 단어 저장
exports.createVocabulary = async (userId, articleId, word, meaning, isBookmarked) => {
  const [rows] = await db.query(
    `INSERT INTO Voca (user_id, article_id, word, meaning, is_bookmarked)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, articleId, word, meaning, isBookmarked],
  );
  return rows;
};

// 이미 존재하는 단어면 북마크/뜻/기사ID 갱신
exports.updateVocabularyBookmark = async (
  vocaId,
  articleId,
  meaning,
  isBookmarked,
) => {
  const [rows] = await db.query(
    `UPDATE Voca
     SET article_id = ?, meaning = ?, is_bookmarked = ?
     WHERE voca_id = ?`,
    [articleId, meaning, isBookmarked, vocaId],
  );
  return rows;
};

// 저장 단어 목록 조회 / 학습 상태별 조회
exports.getVocabularyList = async (userId, status, limit, offset) => {
  let query = `
    SELECT voca_id, word, meaning, learning_status
    FROM Voca
    WHERE user_id = ?
      AND is_bookmarked = true
  `;
  const params = [userId];

  if (status) {
    query += " AND learning_status = ? ";
    params.push(status);
  }

  query += " ORDER BY voca_id DESC LIMIT ? OFFSET ? ";
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
};

// 검색 결과 조회
exports.searchVocabulary = async (userId, keyword) => {
  const [rows] = await db.query(
    `SELECT voca_id, word, meaning, learning_status
     FROM Voca
     WHERE user_id = ?
       AND is_bookmarked = true
       AND word LIKE ?
     ORDER BY voca_id DESC`,
    [userId, `%${keyword}%`],
  );
  return rows;
};

// 특정 단어 조회
exports.findVocabularyById = async (userId, vocaId) => {
  const [rows] = await db.query(
    "SELECT * FROM Voca WHERE user_id = ? AND voca_id = ?",
    [userId, vocaId],
  );
  return rows[0];
};

// 학습 상태 변경
exports.updateVocabularyStatus = async (vocaId, status) => {
  const [rows] = await db.query(
    "UPDATE Voca SET learning_status = ? WHERE voca_id = ?",
    [status, vocaId],
  );
  return rows;
};