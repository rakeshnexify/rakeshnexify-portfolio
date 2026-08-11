import defaultProjects from "../data/defaultProjects.js";
import Project from "../models/Project.js";

async function createDefaultProjectsWhenEmpty() {
  const projectCount = await Project.countDocuments();

  if (projectCount > 0) {
    return;
  }

  try {
    await Project.insertMany(defaultProjects);
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBooleanQuery(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

async function getPublicProjects(req, res, next) {
  try {
    await createDefaultProjectsWhenEmpty();

    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();

    const category = String(req.query.category || "").trim();

    const featured = parseBooleanQuery(req.query.featured);

    const caseStudy = parseBooleanQuery(req.query.caseStudy);

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          category: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          technologies: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category = {
        $regex: `^${escapeRegularExpression(category)}$`,
        $options: "i",
      };
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    if (caseStudy === true) {
      filter["caseStudy.isPublished"] = true;
    }

    const sort = caseStudy
      ? {
          "caseStudy.isFeatured": -1,
          "caseStudy.order": 1,
          order: 1,
          createdAt: 1,
        }
      : {
          order: 1,
          createdAt: 1,
        };

    const projects = await Project.find(filter)
      .select("-createdBy -updatedBy -challenges -solutions -results")
      .sort(sort)
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublicProjectBySlug(req, res, next) {
  try {
    await createDefaultProjectsWhenEmpty();

    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();

    const project = await Project.findOne({
      slug,
      isVisible: true,
    })
      .select("-createdBy -updatedBy")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    project.images = [...(project.images || [])].sort(
      (firstImage, secondImage) => firstImage.order - secondImage.order,
    );

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicProjectBySlug, getPublicProjects };
