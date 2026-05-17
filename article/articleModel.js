const db = require("../db");

exports.findHistories = async (userId) => {
  const [rows] = await db.query(
    `SELECT
        a.article_id,
        a.link,
        a.title,
        a.category,
        a.keywords,
        a.embedding,
        r.read_date AS read_at
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
exports.findRecommendations = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM user_recommendations
    WHERE user_id = ?
      AND created_at >= NOW() - INTERVAL 6 HOUR
    ORDER BY rank_order ASC
    `,
    [userId],
  );

  return rows;
};
exports.deleteOldRecommendations = async (userId) => {
  await db.query(`DELETE FROM user_recommendations WHERE user_id = ?`, [
    userId,
  ]);
};
exports.saveRecommendations = async (userId, recommendations) => {
  for (let i = 0; i < recommendations.length; i++) {
    const article = recommendations[i];

    await db.query(
      `
      INSERT INTO user_recommendations
      (
        user_id,
        rank_order,
        title,
        link,
        summary,
        similarity_score,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        i + 1,
        article.title,
        article.link,
        article.summary,
        article.similarity_score,
        article.published_at,
      ],
    );
  }
};
exports.saveArticle = async ({
  userId,
  title,
  link,
  convertArticle,
  summary,
  keywords,
  embedding,
}) => {
  const [result] = await db.query(
    `
    INSERT INTO Article
    (
      user_id,
      title,
      link,
      convert_article,
      summary,
      keywords,
      embedding
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      convert_article = VALUES(convert_article),
      summary = VALUES(summary),
      keywords = VALUES(keywords),
      embedding = VALUES(embedding),
      created_at = CURRENT_TIMESTAMP
    `,
    [userId, title, link, convertArticle, summary, keywords, embedding],
  );

  return result.insertId;
};
// exports.saveVoca = async (userId, articleId, vocabularies) => {
//   for (const vocab of vocabularies) {
//     await db.query(
//       `
//       INSERT IGNORE INTO Voca
//       (
//         user_id,
//         article_id,
//         word,
//         meaning
//       )
//       VALUES ( ?, ?, ?, ?)
//       `,
//       [userId, articleId, vocab.word, vocab.meaning],
//     );
//   }
// };
exports.saveLog = async (userId, articleId) => {
  await db.query(
    `
    INSERT INTO Reading_log (user_id, article_id, read_date)
    VALUES (?, ?, NOW())
  `,
    [userId, articleId],
  );
};
exports.getArticlesByUserId = async (userId) => {
  const [rows] = await db.query(
    `
  SELECT 
    a.article_id AS articleId,
    a.link,
    a.title,
    rl.read_date AS createdAt
  FROM Reading_log rl
  JOIN Article a ON rl.article_id = a.article_id
  WHERE rl.user_id = ?
  ORDER BY rl.read_date DESC
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
      keywords AS Voca,
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
