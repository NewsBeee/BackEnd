const quizModel = require("./quizModel");
const logger = require("../logs/logger");

// 승급 퀴즈 시작
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

    const aiResult = await quizModel.startPromotionQuiz(userId, user.level);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "QUIZ_200",
      message: "승급 퀴즈 문항 조회에 성공했습니다.",
      result: {
        sessionId: aiResult.session_id,
        question: aiResult.first_item,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 문항 조회 실패 - [ERROR_CODE:003] - ${err.message}`,
      "quiz-service",
    );

    return res.status(err.response?.status || 500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_003",
      message:
        err.response?.data?.detail || "승급 퀴즈 문항 조회에 실패했습니다.",
      result: null,
    });
  }
};

// 승급 퀴즈 답안 제출
exports.submitPromotionQuiz = async (req, res) => {
  const userId = req.session?.user?.id;
  const { sessionId, choiceId } = req.body;

  if (!userId) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_304",
      message: "로그인이 필요합니다.",
      result: null,
    });
  }

  if (!sessionId || choiceId === undefined || choiceId === null) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_001",
      message: "sessionId, choiceId가 필요합니다.",
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

    const aiResult = await quizModel.submitPromotionAnswer(sessionId, choiceId);

    const previousLevel = user.level;
    let newLevel = previousLevel;
    let passed = null;

    if (aiResult.completed && aiResult.result) {
      passed = aiResult.result.promoted;

      if (passed) {
        newLevel = 
          aiResult.result.assigned_grade !== undefined && 
          aiResult.result.assigned_grade !== null 
            ? aiResult.result.assigned_grade 
            : previousLevel + 1;
        await quizModel.updateUserLevel(userId, newLevel);
      }
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "QUIZ_200",
      message: aiResult.completed
        ? "승급 퀴즈 채점이 완료되었습니다."
        : "승급 퀴즈 답안이 제출되었습니다.",
      result: {
        isCorrect: aiResult.is_correct,
        questionNumber: aiResult.question_number,
        completed: aiResult.completed,
        nextQuestion: aiResult.next_item,
        passed,
        previousLevel,
        newLevel,
        quizResult: aiResult.result,
      },
    });
  } catch (err) {
    logger.error(
      `승급 퀴즈 제출 실패 - [ERROR_CODE:003] - ${err.message}`,
      "quiz-service",
    );

    return res.status(err.response?.status || 500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "QUIZ_003",
      message:
        err.response?.data?.detail || "승급 퀴즈 제출에 실패했습니다.",
      result: null,
    });
  }
};