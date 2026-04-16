const onboardingModel = require("./onboardingModel");
const logger = require("../logs/logger");

//온보딩 문제 조회
exports.getQuestions = async (req, res) => {
  try {
    const questions = await onboardingModel.getQuestions();

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "200",
      message: "온보딩 문항 조회에 성공했습니다.",
      result: {
        questions,
      },
    });
  } catch (err) {
    logger.error(
      `온보딩 문항 조회 실패 - [ERROR_CODE:004] - ${err.message}`,
      "onboarding-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "004",
      message: "온보딩 문항 조회에 실패했습니다.",
      result: null,
    });
  }
};

//온보딩 답안 제출
exports.submitAnswers = async (req, res) => {
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
    const rawQuestions = await onboardingModel.getRawQuestions();

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
    let level = 2;
    if (score <= 0) level = 1;
    if (score >= 1) level = 2;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "200",
      message: "초기 어휘 레벨 측정이 완료되었습니다.",
      result: {
        level,
      },
    });
  } catch (err) {
    logger.error(
      `온보딩 제출 실패 - [ERROR_CODE:702] - ${err.message}`,
      "onboarding-service",
    );

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "702",
      message: "온보딩 답안 제출에 실패했습니다.",
      result: null,
    });
  }
};