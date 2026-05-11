const db = require("../db");

//사용자 회원가입 시 사용자 추가
exports.createUser = async (nickname, password, email) => {
  return await db.query(
    "INSERT INTO User (nickname,passwd,email) VALUES (?, ?, ?)",
    [nickname, password, email],
  );
};

//email 중복 여부 확인
exports.findUser = async (email) => {
  const [rows] = await db.query("SELECT * FROM User WHERE email = ?", [email]); //이메일로 가입 시 중복여부 판단
  return rows[0]; // 사용자 한명
};

//id로 특정 사용자 찾기
exports.findUserbyId = async (id) => {
  const [rows] = await db.query("SELECT * FROM User WHERE user_id = ?", [id]); //id로 사용자 조회
  return rows[0]; // 사용자 한명
};

//user테이블 전체 가져오기
exports.viewUser = async () => {
  const [rows] = await db.query("SELECT * FROM User"); //전체 사용자 조회
  return rows;
};

//사용자 삭제
exports.deleteUser = async (id) => {
  const [rows] = await db.query("DELETE from User where user_id=?", [id]); //사용자 삭제
  return rows;
};

//닉네임 수정
exports.updateUser = (nickname, userId) => {
  const [rows] = await db.query(
    "UPDATE User SET nickname = ? WHERE user_id = ?",
    [nickname, userId],
  );
  return rows;
};

exports.findUserstats = async (userId) => {
  const [rows] = await db.query(
    `SELECT
        u.level AS level,

        (
          SELECT COUNT(*)
          FROM Reading_log r
          WHERE r.user_id = u.user_id
        ) AS readArticleCount,

        (
          SELECT COUNT(*)
          FROM Voca v
          WHERE v.user_id = u.user_id
        ) AS savedVocabularyCount,

        (
          SELECT COUNT(*)
          FROM Voca v
          WHERE v.user_id = u.user_id
            AND v.learning_status = 'MEMORIZED'
        ) AS understoodVocabularyCount,

        (
          SELECT COUNT(*)
          FROM Voca v
          WHERE v.user_id = u.user_id
            AND v.learning_status = 'UNMEMORIZED'
        ) AS notUnderstoodVocabularyCount

     FROM User u
     WHERE u.user_id = ?`,
    [userId],
  );

  return rows[0];
};
