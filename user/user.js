const userModel = require("./userModel");
const logger = require("../logs/logger");

const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  const { email, password, nickname } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10); //비밀번호
    await userModel.createUser(nickname, hashed, email);
    const user = await userModel.findUser(email);
    logger.info(`회원가입 성공: ${email}`, "auth-service");
    return res.status(201).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "AUTH_201",
      message: "회원가입이 완료되었습니다.",
      result: {
        userId: user.user_id,
        level: user.level,
      },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      logger.warn(`회원가입 중 중복 이메일: ${email}`, "auth-service");
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "AUTH_400",
        message: "이미 가입된 이메일입니다.",
        result: null,
      });
    } else {
      logger.error(
        `회원가입 오류: ${email} - [ERROR_CODE:305] - ${err.message}`,
        "auth-service",
      );
      return res.status(500).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "AUTH_500",
        message: "회원가입 중 오류가 발생했습니다.",
        result: null,
      });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findUser(email);

    if (!user) {
      logger.warn(`로그인 실패 - 미가입 이메일: ${email}`, "auth-service");
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "AUTH_400",
        message: "가입되지 않은 이메일입니다.",
        result: null,
      });
    }

    const match = await bcrypt.compare(password, user.passwd); //bcrypt암호화
    if (!match) {
      logger.warn(`로그인 실패 - 비밀번호 불일치: ${email}`, "auth-service");
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "AUTH_401",
        message: "비밀번호가 틀립니다.",
        result: null,
      });
    }
    req.session.is_logined = true;
    req.session.email = user.email;
    req.session.nickname = user.nickname; //세션에 정보 저장(로그인여부, 이메일, 사용자이름, 등급)

    req.session.user = {
      id: user.user_id,
      email: user.email,
      nickname: user.nickname,
      level: user.level,
    };
    logger.info(`로그인 성공: ${email}`, "auth-service");
    res.json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "AUTH_200",
      message: "로그인에 성공했습니다.",
      result: {
        userId: user.user_id,
        nickname: user.nickname,
        level: user.level,
      },
    });
  } catch (err) {
    logger.error(`로그인 오류: ${err.message}`, "auth-service");
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "AUTH_500",
      message: "서버 오류가 발생했습니다.",
      result: null,
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    //세션 삭제
    if (err) {
      logger.error(
        `로그아웃 실패 - 세션 삭제 오류 [ERROR_CODE:306] - ${err.message}`,
        "auth-service",
      );
      return res.status(500).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "AUTH_500",
        message: "로그아웃 실패",
        result: null,
      });
    }
    res.json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "AUTH_200",
      message: "로그아웃이 완료되었습니다.",
      result: null,
    });
  });
};

exports.deleteuser = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "AUTH_401",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }
  try {
    await userModel.deleteUser(userId); // DB에서 삭제
    req.session.destroy((err) => {
      if (err) {
        logger.error(`회원탈퇴 오류: ${err.message}`, "auth-service");
        return res.status(500).json({
          timestamp: new Date().toISOString(),
          success: false,
          code: "AUTH_500",
          message: "세션 삭제 실패",
          result: null,
        });
      }
      res.json({
        timestamp: new Date().toISOString(),
        success: true,
        code: "AUTH_200",
        message: "회원 탈퇴가 완료되었습니다.",
      });
    });
  } catch (err) {
    logger.error(`회원탈퇴 오류: ${err.message}`, "auth-service");
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "AUTH_500",
      message: "회원탈퇴 실패",
      result: null,
    });
  }
};

exports.mypage = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "AUTH_401",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  try {
    const user = await userModel.findUserbyId(userId);

    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "USER_404",
        message: "사용자를 찾을 수 없습니다.",
        result: null,
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "USER_200",
      message: "사용자 프로필 조회에 성공했습니다.",
      result: {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
        level: user.level,
      },
    });
  } catch (err) {
    logger.error(`마이페이지 조회 오류: ${err.message}`, "auth-service");
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_500",
      message: "사용자 조회 실패",
      result: null,
    });
  }
};
exports.updatemypage = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_401",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_400",
      message: "닉네임을 입력해주세요.",
      result: null,
    });
  }

  try {
    await userModel.updateUser(nickname, userId);
    req.session.user.nickname = nickname;
    req.session.nickname = nickname;
    logger.info(`닉네임 수정 성공: userId=${userId}`, "auth-service");
    return res.json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "USER_200",
      message: "닉네임이 수정되었습니다.",
      result: { nickname },
    });
  } catch (err) {
    logger.error(`닉네임 수정 오류: ${err.message}`, "auth-service");
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_500",
      message: "닉네임 수정 실패",
      result: null,
    });
  }
};

exports.stats = async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_401",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  try {
    const data = await userModel.findUserstats(userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "USER_200",
      message: "학습 데이터 조회에 성공했습니다.",
      result: {
        level: data.level,
        articleCount: data.readArticleCount,
        savedVocabularyCount: data.savedVocabularyCount,
        understoodVocabularyCount: data.understoodVocabularyCount,
        notUnderstoodVocabularyCount: data.notUnderstoodVocabularyCount,
      },
    });
  } catch (err) {
    logger.error(`학습 데이터 조회 오류: ${err.message}`, "user-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "USER_500",
      message: "학습 데이터 조회 실패",
      result: null,
    });
  }
};
