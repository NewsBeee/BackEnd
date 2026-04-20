const quizModel = require("./quizModel");
const logger = require("../logs/logger");

// 승급 퀴즈 문제 조회
exports.getPromotionQuestions = async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  try {
    const user = await quizModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "QUIZ_302",
        message: "사용자를 찾을 수 없습니다.",
        result: null,
      });
    }

    if (user.total_success < 4) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "QUIZ_705",
        message: "승급 퀴즈 도전 조건을 충족하지 않았습니다.",
        result: null,
      });
    }

    const questions = await quizModel.getQuestions();

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "QUIZ_200",
      message: "승급 퀴즈 문항 조회에 성공했습니다.",
      result: {
        questions,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 문항 조회 실패 - [ERROR_CODE:003] - ${err.message}`,
      "quiz-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_003",
      message: "승급 퀴즈 문항 조회에 실패했습니다.",
      result: null,
    });
  }
};

// 승급 퀴즈 답안 제출
exports.submitPromotionQuiz = async (req, res) => {
  const userId = req.session?.user?.id;
  const { answers } = req.body;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_001",
      message: "답안 형식이 올바르지 않습니다.",
      result: null,
    });
  }

  try {
    const user = await quizModel.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "QUIZ_302",
        message: "사용자를 찾을 수 없습니다.",
        result: null,
      });
    }

    if (user.total_success < 4) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "QUIZ_705",
        message: "승급 퀴즈 도전 조건을 충족하지 않았습니다.",
        result: null,
      });
    }

    const rawQuestions = await quizModel.getRawQuestions();

    let score = 0;

    for (const answer of answers) {
      const targetQuestion = rawQuestions.find(
        (q) => q.questionId === answer.questionId,
      );

      if (targetQuestion && targetQuestion.answer === answer.choiceId) {
        score += 1;
      }
    }

    const previousLevel = user.level;
    const passed = score >= 1;
    const newLevel = passed ? previousLevel + 1 : previousLevel;

    if (passed) {
      await quizModel.updateUserLevel(userId, newLevel);
    }

    logger.info(
      `승급 퀴즈 제출 완료: user_id=${userId}, score=${score}, passed=${passed}, previousLevel=${previousLevel}, newLevel=${newLevel}`,
      "quiz-service",
    );

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "QUIZ_200",
      message: "승급 퀴즈 채점이 완료되었습니다.",
      result: {
        passed,
        previousLevel,
        newLevel,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 제출 실패 - [ERROR_CODE:003] - ${err.message}`,
      "quiz-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_003",
      message: "승급 퀴즈 제출에 실패했습니다.",
      result: null,
    });
  }
};