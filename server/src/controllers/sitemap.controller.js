import Company from "../models/Company.js";
import Project from "../models/Project.js";
import createSitemapXml from "../utils/createSitemapXml.js";

async function getSitemapXml(req, res, next) {
  try {
    const [projects, companies] = await Promise.all([
      Project.find({
        isVisible: true,
      })
        .select({
          slug: 1,
          updatedAt: 1,
        })
        .lean(),

      Company.find({
        isVisible: true,
      })
        .select({
          slug: 1,
          updatedAt: 1,
        })
        .lean(),
    ]);

    const sitemapXml = createSitemapXml({
      projects,
      companies,
    });

    res.setHeader("Content-Type", "application/xml; charset=utf-8");

    /*
     * Browser latest sitemap fetch karega.
     * Production CDN/proxy ise ek hour cache
     * kar sakta hai.
     */
    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    );

    return res.status(200).send(sitemapXml);
  } catch (error) {
    return next(error);
  }
}

export { getSitemapXml };

export default getSitemapXml;
