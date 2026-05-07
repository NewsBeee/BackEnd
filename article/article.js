const articleModel = require("./articleModel");
const logger = require("../logs/logger");
const axios = require("axios");
const cheerio = require("cheerio");

exports.recommendations = async (req, res) => {
  const level = req.session.user?.level;
  const userId = req.session.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "RECOMMEND_401",
        message: "로그인이 필요합니다.",
        result: null,
      });
    }

    // 1. 캐시 먼저 확인
    const cached = await recommendModel.findRecommendations(userId);

    if (cached.length > 0) {
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        success: true,
        code: "RECOMMEND_200",
        message: "추천 기사 조회에 성공했습니다.",
        result: {
          articles: cached,
          cached: true,
        },
      });
    }

    // 2. 캐시 없을 때만 읽기 기록 조회
    const histories = await articleModel.findHistories(userId);
    //요청
    const aiResponse = await axios.post(
      "http://{AI서버주소}:8001/api/recommend/",
      {
        user_id: userId,
        level,
        history: histories || [],
      },
    );
    // 응답
    const aiData = aiResponse.data;
    const recommendations = aiData.recommendations || [];

    // 3. 추천 결과 저장
    await recommendModel.deleteOldRecommendations(userId);
    await recommendModel.saveRecommendations(userId, recommendations);
    //프론트 응답
    return res.status(200).json({
      timestamp: aiData.timestamp || new Date().toISOString(),
      success: true,
      code: "RECOMMEND_200",
      message: "추천 기사 조회에 성공했습니다.",
      result: {
        articles: recommendations,
        cached: false,
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

const GUEST_LIMIT = 5;

exports.getGuestQuota = async (req, res) => {
  const userId = req.session.user?.id;

  let nowCount = null; //사용한 횟수
  if (userId) {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ARTICLE_200",
      message: "회원은 기사 변환 횟수 제한이 없습니다.",
      result: {
        nowCount: null,
        maxCount: null,
      },
    });
  }
  if (!userId) {
    if (req.session.guestCount === undefined) {
      req.session.guestCount = GUEST_LIMIT;
    }

    nowCount = req.session.guestCount; //세션의 카운트
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    success: true,
    code: "ARTICLE_200",
    message: "비회원 기사 변환 잔여 횟수 조회에 성공했습니다.",
    result: {
      nowCount,
      maxCount: GUEST_LIMIT,
    },
  });
};
//파싱 함수
async function parseTitle(link) {
  const response = await axios.get(link, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const $ = cheerio.load(response.data);

  return (
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="title"]').attr("content") ||
    $("title").text()
  )?.trim();
}

exports.transform = async (req, res) => {
  const userId = req.session.user?.id;
  const userLevel = req.session.user?.level;
  const { link } = req.body;

  try {
    if (!link) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_400",
        message: "link가 필요합니다.",
        result: null,
      });
    }

    let nowCount = null; //사용가능횟수

    // 비회원 체크
    if (!userId) {
      if (req.session.guestCount === undefined) {
        req.session.guestCount = GUEST_LIMIT;
      }

      if (req.session.guestCount <= 0) {
        return res.status(403).json({
          timestamp: new Date().toISOString(),
          success: false,
          code: "ARTICLE_403",
          message: "비회원 이용 횟수를 초과했습니다.",
          result: {
            nowCount: 0,
          },
        });
      }
    }

    // AI 요청
    const aiResponse = await axios.post(
      "http://{AI서버주소}:8001/api/convert/process",
      {
        userId: userId || null,
        target_level: userLevel,
        link,
      },
    );

    const aiData = aiResponse.data;
    const convertArticle = aiData?.result?.convertArticle || "";
    const summary = aiData?.result?.summary || "";
    const keywords = aiData?.result?.keywords || [];
    const vocabulary = aiData?.result?.vocabulary || [];
    let articleId = null; //비회원의 경우 null 반환
    //회원은 기사 읽기 기록을 db에 저장
    if (userId) {
      articleId = await articleModel.saveArticle({
        userId,
        link: aiData?.result?.link || link,
        convertArticle,
        summary,
        keywords: JSON.stringify(keywords),
        embedding: aiData?.result?.embedding || null,
      });
      await articleModel.saveVoca(userId, articleId, vocabulary);
    }

    //비회원 횟수 차감
    if (!userId) {
      req.session.guestCount -= 1;
      nowCount = req.session.guestCount; // 사용가능 횟수 저장
    }

    return res.status(200).json({
      timestamp: aiData.timestamp || new Date().toISOString(),
      success: true,
      code: "ARTICLE_200",
      message: "기사 변환이 완료되었습니다.",
      result: {
        articleId, // 회원이면 값, 비회원이면 null
        link: aiData?.result?.link || link,
        convertArticle,
        summary,
        vocabulary,
        nowCount,
      },
    });
  } catch (err) {
    logger.error(`기사 변환 오류: ${err.message}`, "article-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ARTICLE_500",
      message: "기사 변환 중 오류가 발생했습니다.",
      result: null,
    });
  }
};

exports.readinglog = async (req, res) => {
  const userId = req.session.user?.id;
  const { articleId } = req.params;

  try {
    if (!userId) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_401",
        message: "로그인이 필요합니다.",
      });
    }

    if (!articleId) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_400",
        message: "기사를 불러올 수 없습니다.",
      });
    }
    //DB저장
    await articleModel.saveLog(userId, articleId);

    return res.status(201).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ARTICLE_201",
      message: "기사 읽기 기록이 저장되었습니다.",
    });
  } catch (err) {
    logger.error(`기사 읽기 기록 저장 오류: ${err.message}`, "article-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ARTICLE_500",
      message: "기사 읽기 기록 저장 중 DB 오류가 발생했습니다.",
    });
  }
};

//기사 목록 조회
exports.articlelist = async (req, res) => {
  const userId = req.session.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_401",
        message: "로그인이 필요합니다.",
        result: null,
      });
    }

    const articles = await articleModel.getArticlesByUserId(userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ARTICLE_200",
      message: "기사 목록 조회에 성공했습니다.",
      result: {
        articles,
      },
    });
  } catch (err) {
    logger.error(`기사 목록 조회 오류: ${err.message}`, "article-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ARTICLE_500",
      message: "기사 목록 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};
exports.articledetail = async (req, res) => {
  const userId = req.session.user?.id;
  const { articleId } = req.params;

  try {
    if (!userId) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_401",
        message: "로그인이 필요합니다.",
        result: null,
      });
    }

    const article = await articleModel.getArticleDetail(userId, articleId);
    const vocabulary = await articleModel.getVoca(userId, articleId);

    if (!article) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        success: false,
        code: "ARTICLE_404",
        message: "기사를 찾을 수 없습니다.",
        result: null,
      });
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      success: true,
      code: "ARTICLE_200",
      message: "기사 상세 조회에 성공했습니다.",
      result: {
        articleId: article.articleId,
        link: article.link,
        convertArticle: article.convertArticle,
        summary: article.summary,
        vocabulary,
        createdAt: article.createdAt,
      },
    });
  } catch (err) {
    logger.error(`기사 상세 조회 오류: ${err.message}`, "article-service");

    return res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      code: "ARTICLE_500",
      message: "기사 상세 조회 중 오류가 발생했습니다.",
      result: null,
    });
  }
};
