import Statistic from "../models/Statistic.js";

async function getPublicStatistics(req, res, next) {
  try {
    const statistics = await Statistic.find({
      isVisible: true,
    })
      .select("-createdBy -updatedBy")
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: statistics.length,
      data: statistics,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicStatistics };
