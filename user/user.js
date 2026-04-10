const userModel = require("../userModel");
const passport = require("../controllers/passport");
const logger = require("../../logs/loggers");

const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  const { email, password, nickname } = req.body;
  const hashed = await bcrypt.hash(password, 10); //비밀번호

  try {
    await userModel.createUser(username, email, hashed, nickname);
    logger.info(`회원가입 성공: ${email}`, "auth-service");
    return res.status(200).json({ message: "회원가입 완료!" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      logger.warn(`회원가입 중 중복 이메일: ${email}`, "auth-service");
      return res.status(301).json({ message: "이미 가입된 이메일입니다." });
    } else {
      logger.error(
        `회원가입 오류: ${email} - [ERROR_CODE:305] - ${err.message}`,
        "auth-service",
      );
      return res
        .status(305)
        .json({ message: "회원가입 중 오류가 발생했습니다." });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findUser(email);

  if (!user) {
    logger.warn(`로그인 실패 - 미가입 이메일: ${email}`, "auth-service");
    return res.status(302).json({ message: "가입되지 않은 이메일 입니다." }); //오류메시지
  }
  const match = await bcrypt.compare(password, user.password); //bcrypt암호화
  if (!match) {
    logger.warn(`로그인 실패 - 비밀번호 불일치: ${email}`, "auth-service");
    return res.status(303).json({ message: "비밀번호가 틀립니다." }); //오류메시지
  }
  req.session.is_logined = true;
  req.session.useremail = user.email;
  req.session.nickname = user.nickname; //세션에 정보 저장(로그인여부, 이메일, 사용자이름, 등급)

  req.session.user = {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
  };
  logger.info(`로그인 성공: ${email}`, "auth-service");
  res.json({
    message: "로그인 성공",
    is_logined: true,
    nickname: user.nickname,
  }); //메시지, 프론트 화면 구분용
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    //세션 삭제
    if (err) {
      logger.error(
        `로그아웃 실패 - 세션 삭제 오류 [ERROR_CODE:306] -${err.message}`,
        "auth-service",
      );
      return res.status(306).json({ message: "로그아웃 실패" });
    }
    res.json({ message: "로그아웃되었습니다.", is_logined: false }); //로그아웃 성공 시 is_logined=false로 설정
  });
};

exports.checkLogin = (req, res) => {
  //세션에 로그인 정보가 있으면 로그인 상태
  if (req.session && req.session.is_logined) {
    return res.json({
      is_logined: true,
      email: user.email,
      nickname: user.nickname,
    });
  }

  //세션이 없으면 비로그인 상태
  return res.json({
    is_logined: false,
  });
};
