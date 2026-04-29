const articleModel = require("../articleModel");
const logger = require("../logs/logger");
const axios = require("axios");

exports.recommendations = async (req, res) => {
  const level = req.session.user?.level;
  const userId = req.session.user?.id;

  try {
    const findHistories = await articleModel.findHistories(userId);

    if (!userId) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "RECOMMEND_302",
        message: "로그인이 필요합니다.",
        result: null,
      });
    }

    const aiResponse = await axios.post("http://기사추천", {
      userId,
      level,
      findHistories,
    });

    const aiData = aiResponse.data;

    logger.info(
      `추천 기사 조회 성공: user=${userId}, level=${level}`,
      "recommend-service",
    );

    // 3. 최종 응답 포맷 변환
    return res.status(200).json({
      timestamp: aiData.timestamp || new Date().toISOString(),
      success: true,
      code: "RECOMMEND_200",
      message: "추천 기사 조회에 성공했습니다.",
      result: {
        articles: aiData?.result?.articles || [],
      },
    });
  } catch (err) {
    logger.error(`추천 기사 조회 오류: ${err.message}`, "recommend-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "RECOMMEND_500",
      message: "추천 기사 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};
