const db = require("../db");

exports.findHistories = async (userId) => {
  const [rows] = await db.query(
    `SELECT
        a.article_id,
        a.link,
        a.category,
        a.keywords,
        a.summary,
        a.embedding,
        r.read_date
     FROM Reading_log r
     JOIN Article a
       ON r.article_id = a.article_id
     WHERE r.user_id = ?
       AND a.embedding IS NOT NULL
     ORDER BY r.read_date DESC
     LIMIT 20`,
    [userId],
  );

  return rows;
};
exports.saveArticle = async (
  userId,
  link,
  convertArticle,
  summary,
  keywords,
  embedding,
) => {
  const [result] = await db.query(
    `
    INSERT INTO Article
      (user_id, link, convert_article, summary, keywords, embedding, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    `,
    [userId, link, convertArticle, summary, keywords, embedding],
  );

  return result.insertId;
};
exports.saveLog = async (userId, articleId) => {
  await db.query(
    `
    INSERT INTO reading_log (user_id, article_id, read_date)
    VALUES (?, ?, NOW())
`,
    [userId, articleId],
  );
};
exports.saveVoca = async (userId, articleId, vocabulary) => {
  if (!Array.isArray(vocabulary) || vocabulary.length === 0) return;

  for (const item of vocabulary) {
    await db.query(
      `INSERT INTO Voca (user_id, article_id, word, meaning)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         meaning = VALUES(meaning)`,
      [userId, articleId, item.word, item.meaning],
    );
  }
};
exports.getArticlesByUserId = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      article_id AS articleId,
      link,
      summary,
      created_at AS createdAt
    FROM Article
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId],
  );

  return rows;
};
exports.getArticleDetail = async (userId, articleId) => {
  const [rows] = await db.query(
    `
    SELECT
      article_id AS articleId,
      link,
      convert_article AS convertArticle,
      summary,
      keywords AS vocabulary,
      DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
    FROM Article
    WHERE user_id = ? AND article_id = ?
    `,
    [userId, articleId],
  );

  return rows[0];
};
exports.getVoca = async (userId, articleId) => {
  const [rows] = await db.query(
    `SELECT word, meaning, is_bookmarked, learning_status
     FROM Voca
     WHERE user_id = ? AND article_id = ?`,
    [userId, articleId],
  );

  return rows;
};
