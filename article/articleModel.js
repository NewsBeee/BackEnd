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
exports.findRecentRecommendations = async (userId) => {
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
    INSERT INTO article
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
    `,
    [userId, title, link, convertArticle, summary, keywords, embedding],
  );

  return result.insertId;
};
exports.saveVoca = async (userId, articleId, vocabularies) => {
  for (const vocab of vocabularies) {
    await db.query(
      `
      INSERT INTO vocabulary
      (
        user_id,
        article_id,
        word,
        level,
        meaning,
        sentence_index
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        articleId,
        vocab.word,
        vocab.level,
        vocab.meaning,
        vocab.sentence_index,
      ],
    );
  }
};
exports.getArticlesByUserId = async (userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      article_id AS articleId,
      link,
      title,
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
