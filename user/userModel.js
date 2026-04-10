const db = require("./db");

//사용자 회원가입 시 사용자 추가
exports.createUser = async (nickname, password, email) => {
  return await db.query(
    "INSERT INTO user (nickname,password,email) VALUES (?, ?, ?)",
    [nickname, password, email],
  );
};

//email 중복 여부 확인
exports.findUser = async (email) => {
  const [rows] = await db.query("SELECT * FROM user WHERE email = ?", [email]); //이메일로 가입 시 중복여부 판단
  return rows[0]; // 사용자 한명
};

//id로 특정 사용자 찾기
exports.findUserbyId = async (id) => {
  const [rows] = await db.query("SELECT * FROM user WHERE id = ?", [id]); //id로 사용자 조회
  return rows[0]; // 사용자 한명
};

//user테이블 전체 가져오기
exports.viewUser = async () => {
  const [rows] = await db.query("SELECT * FROM user"); //전체 사용자 조회
  return rows; // 사용자 한명
};

//사용자 삭제
exports.delUser = async (id) => {
  const [rows] = await db.query("DELETE from user where id=?", [id]); //사용자 삭제
  return rows;
};
