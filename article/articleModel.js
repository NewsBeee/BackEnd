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
