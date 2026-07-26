import defaultServices from "../data/defaultServices.js";
import Service from "../models/Service.js";

async function createDefaultServicesWhenEmpty() {
  const serviceCount = await Service.countDocuments();

  if (serviceCount > 0) {
    return;
  }

  try {
    await Service.insertMany(defaultServices);
  } catch (error) {
    // Development me two simultaneous requests aane par unique slug
    // conflict ho sakta hai. Existing data safe rahega.
    if (error?.code !== 11000) {
      throw error;
    }
  }
}

async function getPublicServices(req, res, next) {
  try {
    await createDefaultServicesWhenEmpty();

    const services = await Service.find({
      isVisible: true,
    })
      .select("-createdBy -updatedBy")
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
}

export { getPublicServices };
