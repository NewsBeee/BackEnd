const quizModel = require("./quizModel");
const logger = require("../logs/logger");

//승급 퀴즈 문제 조회
exports.getPromotionQuestions = async (req, res) => {
  try {
    const questions = await quizModel.getQuestions();

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "200",
      message: "승급 퀴즈 문항 조회에 성공했습니다.",
      result: {
        questions,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 문항 조회 실패 - [ERROR_CODE:004] - ${err.message}`,
      "quiz-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "004",
      message: "승급 퀴즈 문항 조회에 실패했습니다.",
      result: null,
    });
  }
};

//승급 퀴즈 답안 제출
exports.submitPromotionQuiz = async (req, res) => {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "001",
      message: "답안 형식이 올바르지 않습니다.",
      result: null,
    });
  }

  try {
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

    //임시 레벨 계산
    //AI 연동 시 수정
    const previousLevel = 2;
    const passed = score >= 1;
    const newLevel = passed ? previousLevel + 1 : previousLevel;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "200",
      message: "승급 퀴즈 채점이 완료되었습니다.",
      result: {
        passed,
        previousLevel,
        newLevel,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 제출 실패 - [ERROR_CODE:702] - ${err.message}`,
      "quiz-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "702",
      message: "승급 퀴즈 제출에 실패했습니다.",
      result: null,
    });
  }
};