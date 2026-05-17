const challengeModel = require("./challengeModel");
const logger = require("../logs/logger");

// YYYY-MM-DD 문자열로 반환
const formatDate = (date) => {
  return date.toISOString().slice(0, 10);
};

// weekStart 기준으로 weekEnd 계산
const getWeekEnd = (weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return formatDate(end);
};

// 요일별 false 기본값
const createDefaultDailyStatus = () => ({
  sun: false,
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
});

const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// 주간 목표 설정
exports.createChallenge = async (req, res) => {
  const userId = req.session?.user?.id;
  const { weekStart, category, goal } = req.body;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!weekStart || !category || goal === undefined || goal === null) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_001",
      message: "필수 입력값이 누락되었습니다.",
      result: null,
    });
  }

  if (goal <= 0) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_602",
      message: "목표값이 올바르지 않습니다.",
      result: null,
    });
  }

  try {
    const existing = await challengeModel.findChallengeByWeekStart(
      userId,
      weekStart,
    );

    if (existing) {
      return res.status(409).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "CHALLENGE_601",
        message: "해당 주차 챌린지가 이미 존재합니다.",
        result: null,
      });
    }

    const rows = await challengeModel.createChallenge(
      userId,
      weekStart,
      category,
      goal,
    );

    logger.info(
      `주간 목표 설정 성공: user_id=${userId}, weekStart=${weekStart}, category=${category}, goal=${goal}`,
      "challenge-service",
    );

    return res.status(201).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "CHALLENGE_201",
      message: "주간 목표가 설정되었습니다.",
      result: {
        challengeId: rows.insertId,
      },
    });
  } catch (err) {
    logger.error(
      `주간 목표 설정 실패: user_id=${userId} - [ERROR_CODE:603] - ${err.message}`,
      "challenge-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_603",
      message: "주간 목표 설정 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 현재 주간 목표 조회
exports.getCurrentChallenge = async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  try {
    const challenge = await challengeModel.findCurrentChallenge(userId);

    if (!challenge) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "CHALLENGE_604",
        message: "현재 주간 목표가 존재하지 않습니다.",
        result: null,
      });
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "CHALLENGE_200",
      message: "현재 주간 목표 조회에 성공했습니다.",
      result: {
        challengeId: challenge.challenge_id,
        weekStart: formatDate(new Date(challenge.week_start)),
        category: challenge.category,
        goal: challenge.goal,
        isSuccess: !!challenge.is_success,
      },
    });
  } catch (err) {
    logger.error(
      `현재 주간 목표 조회 실패: user_id=${userId} - ${err.message}`,
      "challenge-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_603",
      message: "현재 주간 목표 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 주간 학습 진행 현황 조회
exports.getChallengeProgress = async (req, res) => {
  const userId = req.session?.user?.id;
  const { weekStart } = req.query;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!weekStart) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_001",
      message: "weekStart 값이 필요합니다.",
      result: null,
    });
  }

  try {
    const challenge = await challengeModel.findChallengeByWeekStart(
      userId,
      weekStart,
    );

    if (!challenge) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "CHALLENGE_604",
        message: "해당 주차 챌린지를 찾을 수 없습니다.",
        result: null,
      });
    }

    const weekEnd = getWeekEnd(weekStart);

    const dailyLogs = await challengeModel.findWeeklyReadingLogs(
      userId,
      weekStart,
      weekEnd,
    );

    const challengeLogs = await challengeModel.findWeeklyChallengeLogs(
      userId,
      weekStart,
      weekEnd,
      challenge.category,
    );

    const dailyStatus = createDefaultDailyStatus();

    for (const log of dailyLogs) {
      const dayKey = dayMap[new Date(log.read_date).getDay()];
      dailyStatus[dayKey] = true;
    }

    const completedArticleCount = challengeLogs.length;
    const isSuccess = completedArticleCount >= challenge.goal;

    if (challenge.is_success !== isSuccess) {
      await challengeModel.updateChallengeSuccess(
        challenge.challenge_id,
        isSuccess,
      );
      await challengeModel.updateUserTotalSuccess(userId);
    }

    const user = await challengeModel.findUserById(userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "CHALLENGE_200",
      message: "주간 학습 진행 현황 조회에 성공했습니다.",
      result: {
        category: challenge.category,
        targetArticleCount: challenge.goal,
        completedArticleCount,
        dailyStatus,
        promotionQuizAvailable: user.total_success >= 4,
      },
    });
  } catch (err) {
    logger.error(
      `주간 학습 진행 현황 조회 실패: user_id=${userId} - ${err.message}`,
      "challenge-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_603",
      message: "주간 학습 진행 현황 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

// 주간 챌린지 달성 이력 조회
exports.getChallengeHistory = async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  try {
    const completedWeeks = await challengeModel.countCompletedWeeks(userId);
    const readArticles = await challengeModel.countReadArticles(userId);
    const user = await challengeModel.findUserById(userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "CHALLENGE_200",
      message: "주간 챌린지 달성 이력 조회에 성공했습니다.",
      result: {
        completedWeekCount: completedWeeks.completedWeekCount,
        readArticleCount: readArticles.readArticleCount,
        level: user.level,
      },
    });
  } catch (err) {
    logger.error(
      `주간 챌린지 달성 이력 조회 실패: user_id=${userId} - ${err.message}`,
      "challenge-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "CHALLENGE_603",
      message: "주간 챌린지 달성 이력 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};