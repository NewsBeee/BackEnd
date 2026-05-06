const onboardingModel = require("./onboardingModel");
const logger = require("../logs/logger");

// 온보딩 퀴즈 시작
exports.getQuestions = async (req, res) => {
  const userId = req.session?.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ONBOARDING_001",
      message: "userId가 필요합니다.",
      result: null,
    });
  }

  try {
    const aiResult = await onboardingModel.startOnboardingQuiz(userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ONBOARDING_200",
      message: "온보딩 문항 조회에 성공했습니다.",
      result: {
        sessionId: aiResult.session_id,
        question: aiResult.first_item,
      },
    });
  } catch (err) {
    logger.error(
      `온보딩 문항 조회 실패 - [ERROR_CODE:003] - ${err.message}`,
      "onboarding-service",
    );

    return res.status(err.response?.status || 500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ONBOARDING_003",
      message:
        err.response?.data?.detail || "온보딩 문항 조회에 실패했습니다.",
      result: null,
    });
  }
};

// 온보딩 답안 제출
exports.submitAnswers = async (req, res) => {
  const userId = req.session?.user?.id || req.body.userId;
  const { sessionId, choiceId } = req.body;

  if (!userId || !sessionId || choiceId === undefined || choiceId === null) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ONBOARDING_001",
      message: "userId, sessionId, choiceId가 필요합니다.",
      result: null,
    });
  }

  try {
    const aiResult = await onboardingModel.submitOnboardingAnswer(
      sessionId,
      choiceId,
    );

    let level = null;

    if ( 
      aiResult.completed && 
      aiResult.result && 
      aiResult.result.assigned_grade !== undefined && 
      aiResult.result.assigned_grade !== null
    ) {
      level = aiResult.result.assigned_grade;
      await onboardingModel.updateUserLevel(userId, level);
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ONBOARDING_200",
      message: aiResult.completed
        ? "초기 어휘 레벨 측정이 완료되었습니다."
        : "온보딩 답안이 제출되었습니다.",
      result: {
        isCorrect: aiResult.is_correct,
        questionNumber: aiResult.question_number,
        completed: aiResult.completed,
        nextQuestion: aiResult.next_item,
        level,
        quizResult: aiResult.result,
      },
    });
  } catch (err) {
    logger.error(
      `온보딩 제출 실패 - [ERROR_CODE:003] - ${err.message}`,
      "onboarding-service",
    );

    return res.status(err.response?.status || 500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ONBOARDING_003",
      message:
        err.response?.data?.detail || "온보딩 답안 제출에 실패했습니다.",
      result: null,
    });
  }
};