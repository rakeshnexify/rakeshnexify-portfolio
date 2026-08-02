import defaultStatistics from "../data/defaultStatistics.js";
import Statistic from "../models/Statistic.js";

async function createDefaultStatisticsWhenEmpty() {
  const statisticCount = await Statistic.countDocuments();

  if (statisticCount > 0) {
    return;
  }

  try {
    await Statistic.insertMany(defaultStatistics);
  } catch (error) {
    /*
     * Development mein simultaneous requests aane par
     * unique statistic key conflict ho sakta hai.
     * Existing records safe rahenge.
     */
    if (error?.code !== 11000) {
      throw error;
    }
  }
}

async function getPublicStatistics(req, res, next) {
  try {
    await createDefaultStatisticsWhenEmpty();

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
