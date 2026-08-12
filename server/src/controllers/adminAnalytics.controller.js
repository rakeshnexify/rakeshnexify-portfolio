import Appointment, {
  APPOINTMENT_STATUSES,
} from "../models/Appointment.js";
import ContactMessage, {
  contactMessageStatuses,
} from "../models/ContactMessage.js";
import Lead, {
  leadStatuses,
} from "../models/Lead.js";
import ServiceOrder, {
  serviceOrderStatuses,
} from "../models/ServiceOrder.js";
import Subscriber, {
  SUBSCRIBER_STATUSES,
} from "../models/Subscriber.js";

const ANALYTICS_RANGE_KEYS = [
  "7d",
  "30d",
  "90d",
  "all",
];

const OPEN_LEAD_STATUSES = [
  "new",
  "qualified",
  "contacted",
  "proposal",
  "negotiation",
];

const MAX_TOP_SERVICES = 5;
const MAX_LEAD_SOURCES = 20;
const MAX_PIPELINE_CURRENCIES = 20;

const RANGE_CONFIG = {
  "7d": {
    days: 7,
    bucket: "day",
  },
  "30d": {
    days: 30,
    bucket: "day",
  },
  "90d": {
    days: 90,
    bucket: "week",
  },
  all: {
    days: null,
    bucket: "month",
  },
};

function isPlainQueryObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function createQueryValidationResult(query) {
  if (!isPlainQueryObject(query)) {
    return {
      rangeKey: null,
      fieldErrors: {
        range:
          "Analytics query parameters must be provided as a valid query object.",
      },
    };
  }

  const allowedFields = new Set([
    "range",
  ]);

  const fieldErrors = {};

  Object.keys(query).forEach((fieldName) => {
    if (!allowedFields.has(fieldName)) {
      fieldErrors[fieldName] =
        "This analytics query parameter is not supported.";
    }
  });

  const receivedRange = query.range;

  if (receivedRange === undefined) {
    return {
      rangeKey: "30d",
      fieldErrors,
    };
  }

  if (
    typeof receivedRange !== "string" ||
    !ANALYTICS_RANGE_KEYS.includes(
      receivedRange,
    )
  ) {
    fieldErrors.range =
      "Range must be one of: 7d, 30d, 90d or all.";
  }

  return {
    rangeKey:
      fieldErrors.range
        ? null
        : receivedRange,
    fieldErrors,
  };
}

function getUtcDayStart(date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function createRange(rangeKey) {
  const now = new Date();
  const config = RANGE_CONFIG[rangeKey];

  if (rangeKey === "all") {
    return {
      key: rangeKey,
      from: null,
      to: now,
      timezone: "UTC",
      bucket: config.bucket,
    };
  }

  const todayStart = getUtcDayStart(now);

  const from = new Date(todayStart);

  from.setUTCDate(
    from.getUTCDate() -
      (config.days - 1),
  );

  return {
    key: rangeKey,
    from,
    to: now,
    timezone: "UTC",
    bucket: config.bucket,
  };
}

function createDateMatch(
  fieldName,
  range,
) {
  if (!range.from) {
    return {
      [fieldName]: {
        $lte: range.to,
      },
    };
  }

  return {
    [fieldName]: {
      $gte: range.from,
      $lte: range.to,
    },
  };
}

function createDateTruncExpression(
  fieldName,
  bucket,
) {
  const expression = {
    date: `$${fieldName}`,
    unit: bucket,
    timezone: "UTC",
  };

  if (bucket === "week") {
    expression.startOfWeek = "monday";
  }

  return {
    $dateTrunc: expression,
  };
}

function createTrendFacet(
  fieldName,
  bucket,
) {
  return [
    {
      $group: {
        _id: createDateTruncExpression(
          fieldName,
          bucket,
        ),
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ];
}

function readFacetCount(value) {
  return Number(
    value?.[0]?.count || 0,
  );
}

function createZeroStatusMap(statuses) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      0,
    ]),
  );
}

function readStatusBreakdown(
  rows,
  statuses,
) {
  const result =
    createZeroStatusMap(statuses);

  (Array.isArray(rows) ? rows : [])
    .forEach((row) => {
      if (
        typeof row?._id === "string" &&
        Object.hasOwn(
          result,
          row._id,
        )
      ) {
        result[row._id] =
          Number(row.count || 0);
      }
    });

  return result;
}

function readTrendRows(rows) {
  return (
    Array.isArray(rows)
      ? rows
      : []
  )
    .filter(
      (row) =>
        row?._id instanceof Date &&
        !Number.isNaN(
          row._id.getTime(),
        ),
    )
    .map((row) => ({
      start: row._id,
      count: Number(
        row.count || 0,
      ),
    }));
}

function getUtcBucketStart(
  date,
  bucket,
) {
  const value =
    new Date(date);

  if (bucket === "day") {
    return getUtcDayStart(value);
  }

  if (bucket === "week") {
    const start =
      getUtcDayStart(value);

    const day =
      start.getUTCDay();

    const daysSinceMonday =
      day === 0
        ? 6
        : day - 1;

    start.setUTCDate(
      start.getUTCDate() -
        daysSinceMonday,
    );

    return start;
  }

  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      1,
    ),
  );
}

function getNextUtcBucket(
  date,
  bucket,
) {
  const value =
    new Date(date);

  if (bucket === "day") {
    value.setUTCDate(
      value.getUTCDate() + 1,
    );
    return value;
  }

  if (bucket === "week") {
    value.setUTCDate(
      value.getUTCDate() + 7,
    );
    return value;
  }

  value.setUTCMonth(
    value.getUTCMonth() + 1,
    1,
  );

  return value;
}

function mergeTrendSeries(
  range,
  seriesByKey,
) {
  const bucketMap = new Map();

  function ensureBucket(date) {
    const key =
      date.toISOString();

    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        start: key,
        orders: 0,
        appointments: 0,
        leads: 0,
        contactMessages: 0,
        subscriberActivity: 0,
      });
    }

    return bucketMap.get(key);
  }

  if (range.from) {
    let cursor =
      getUtcBucketStart(
        range.from,
        range.bucket,
      );

    const lastBucket =
      getUtcBucketStart(
        range.to,
        range.bucket,
      );

    while (
      cursor.getTime() <=
      lastBucket.getTime()
    ) {
      ensureBucket(cursor);

      cursor =
        getNextUtcBucket(
          cursor,
          range.bucket,
        );
    }
  }

  Object.entries(seriesByKey)
    .forEach(
      ([seriesKey, rows]) => {
        rows.forEach((row) => {
          const bucket =
            ensureBucket(row.start);

          bucket[seriesKey] =
            row.count;
        });
      },
    );

  return [...bucketMap.values()]
    .sort(
      (first, second) =>
        new Date(first.start) -
        new Date(second.start),
    );
}

function calculateRate(
  numerator,
  denominator,
) {
  const safeNumerator =
    Number(numerator || 0);

  const safeDenominator =
    Number(denominator || 0);

  if (safeDenominator <= 0) {
    return 0;
  }

  return Number(
    (
      (safeNumerator /
        safeDenominator) *
      100
    ).toFixed(2),
  );
}

function readConversion(rows) {
  const row =
    rows?.[0] || {};

  const eligible =
    Number(row.eligible || 0);

  const converted =
    Number(row.converted || 0);

  return {
    eligible,
    converted,
    rate: calculateRate(
      converted,
      eligible,
    ),
  };
}

function readLeadWonRate(rows) {
  const row =
    rows?.[0] || {};

  const won =
    Number(row.won || 0);

  const lost =
    Number(row.lost || 0);

  const eligible =
    won + lost;

  return {
    eligible,
    won,
    lost,
    rate: calculateRate(
      won,
      eligible,
    ),
  };
}

function readLeadSources(rows) {
  return (
    Array.isArray(rows)
      ? rows
      : []
  ).map((row) => ({
    source:
      typeof row?._id === "string" &&
      row._id.trim()
        ? row._id
        : "unknown",
    count: Number(
      row.count || 0,
    ),
  }));
}

function readPipelineValues(rows) {
  return (
    Array.isArray(rows)
      ? rows
      : []
  ).map((row) => ({
    currency:
      typeof row?._id === "string"
        ? row._id
        : "",
    amount: Number(
      row.amount || 0,
    ),
    leadCount: Number(
      row.leadCount || 0,
    ),
  }));
}

function readTopServices(rows) {
  return (
    Array.isArray(rows)
      ? rows
      : []
  ).map((row) => ({
    slug:
      String(
        row?._id || "",
      ),
    title:
      String(
        row?.title || "",
      ),
    count: Number(
      row.count || 0,
    ),
  }));
}

function createStatusFacet() {
  return [
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ];
}

function createConversionLookupFacet(
  sourceFieldName,
) {
  return [
    {
      $lookup: {
        from: "leads",
        let: {
          sourceId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  `$${sourceFieldName}`,
                  "$$sourceId",
                ],
              },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "convertedLead",
      },
    },
    {
      $group: {
        _id: null,
        eligible: {
          $sum: 1,
        },
        converted: {
          $sum: {
            $cond: [
              {
                $gt: [
                  {
                    $size:
                      "$convertedLead",
                  },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];
}

function createServiceOrderPipeline(
  range,
) {
  const match =
    createDateMatch(
      "createdAt",
      range,
    );

  return [
    {
      $match: match,
    },
    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],
        statuses:
          createStatusFacet(),
        trend:
          createTrendFacet(
            "createdAt",
            range.bucket,
          ),
        topServices: [
          {
            $match: {
              "serviceSnapshot.slug": {
                $type: "string",
                $ne: "",
              },
              "serviceSnapshot.title": {
                $type: "string",
                $ne: "",
              },
            },
          },
          {
            $group: {
              _id:
                "$serviceSnapshot.slug",
              title: {
                $min:
                  "$serviceSnapshot.title",
              },
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
              title: 1,
              _id: 1,
            },
          },
          {
            $limit:
              MAX_TOP_SERVICES,
          },
        ],
      },
    },
  ];
}

function createAppointmentPipeline(
  range,
) {
  const match =
    createDateMatch(
      "createdAt",
      range,
    );

  return [
    {
      $match: match,
    },
    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],
        statuses:
          createStatusFacet(),
        trend:
          createTrendFacet(
            "createdAt",
            range.bucket,
          ),
        conversion:
          createConversionLookupFacet(
            "sourceAppointment",
          ),
      },
    },
  ];
}

function createLeadPipeline(
  range,
) {
  const match =
    createDateMatch(
      "createdAt",
      range,
    );

  return [
    {
      $match: match,
    },
    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],
        statuses:
          createStatusFacet(),
        trend:
          createTrendFacet(
            "createdAt",
            range.bucket,
          ),
        sources: [
          {
            $group: {
              _id: {
                $let: {
                  vars: {
                    normalizedSource: {
                      $toLower: {
                        $trim: {
                          input: {
                            $ifNull: [
                              "$source",
                              "",
                            ],
                          },
                        },
                      },
                    },
                  },
                  in: {
                    $cond: [
                      {
                        $gt: [
                          {
                            $strLenCP:
                              "$$normalizedSource",
                          },
                          0,
                        ],
                      },
                      "$$normalizedSource",
                      "unknown",
                    ],
                  },
                },
              },
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
              _id: 1,
            },
          },
          {
            $limit:
              MAX_LEAD_SOURCES,
          },
        ],
        wonRate: [
          {
            $match: {
              status: {
                $in: [
                  "won",
                  "lost",
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              won: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "won",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              lost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "lost",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        pipelineValue: [
          {
            $match: {
              status: {
                $in:
                  OPEN_LEAD_STATUSES,
              },
              estimatedValue: {
                $type: "number",
                $gte: 0,
              },
              currency: {
                $type: "string",
                $ne: "",
              },
            },
          },
          {
            $group: {
              _id: "$currency",
              amount: {
                $sum:
                  "$estimatedValue",
              },
              leadCount: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              amount: -1,
              _id: 1,
            },
          },
          {
            $limit:
              MAX_PIPELINE_CURRENCIES,
          },
        ],
      },
    },
  ];
}

function createContactMessagePipeline(
  range,
) {
  const match =
    createDateMatch(
      "createdAt",
      range,
    );

  return [
    {
      $match: match,
    },
    {
      $facet: {
        total: [
          {
            $count: "count",
          },
        ],
        statuses:
          createStatusFacet(),
        trend:
          createTrendFacet(
            "createdAt",
            range.bucket,
          ),
        conversion:
          createConversionLookupFacet(
            "sourceContactMessage",
          ),
      },
    },
  ];
}

function createSubscriberPipeline(
  range,
) {
  const activityMatch =
    createDateMatch(
      "subscribedAt",
      range,
    );

  return [
    {
      $facet: {
        activityTotal: [
          {
            $match:
              activityMatch,
          },
          {
            $count: "count",
          },
        ],
        activityStatuses: [
          {
            $match:
              activityMatch,
          },
          ...createStatusFacet(),
        ],
        trend: [
          {
            $match:
              activityMatch,
          },
          ...createTrendFacet(
            "subscribedAt",
            range.bucket,
          ),
        ],
        currentStatuses:
          createStatusFacet(),
      },
    },
  ];
}

async function getAdminAnalytics(
  req,
  res,
  next,
) {
  const {
    rangeKey,
    fieldErrors,
  } =
    createQueryValidationResult(
      req.query,
    );

  if (
    Object.keys(fieldErrors).length >
    0
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Please correct the analytics query parameters.",
        fieldErrors,
      });
  }

  const range =
    createRange(rangeKey);

  try {
    const [
      orderAggregate,
      appointmentAggregate,
      leadAggregate,
      contactAggregate,
      subscriberAggregate,
    ] = await Promise.all([
      ServiceOrder.aggregate(
        createServiceOrderPipeline(
          range,
        ),
      ),
      Appointment.aggregate(
        createAppointmentPipeline(
          range,
        ),
      ),
      Lead.aggregate(
        createLeadPipeline(
          range,
        ),
      ),
      ContactMessage.aggregate(
        createContactMessagePipeline(
          range,
        ),
      ),
      Subscriber.aggregate(
        createSubscriberPipeline(
          range,
        ),
      ),
    ]);

    const orders =
      orderAggregate?.[0] || {};

    const appointments =
      appointmentAggregate?.[0] || {};

    const leads =
      leadAggregate?.[0] || {};

    const contacts =
      contactAggregate?.[0] || {};

    const subscribers =
      subscriberAggregate?.[0] || {};

    const currentSubscriberStatuses =
      readStatusBreakdown(
        subscribers.currentStatuses,
        SUBSCRIBER_STATUSES,
      );

    const currentSubscriberTotal =
      Object.values(
        currentSubscriberStatuses,
      ).reduce(
        (total, count) =>
          total + count,
        0,
      );

    const trends =
      mergeTrendSeries(
        range,
        {
          orders:
            readTrendRows(
              orders.trend,
            ),
          appointments:
            readTrendRows(
              appointments.trend,
            ),
          leads:
            readTrendRows(
              leads.trend,
            ),
          contactMessages:
            readTrendRows(
              contacts.trend,
            ),
          subscriberActivity:
            readTrendRows(
              subscribers.trend,
            ),
        },
      );

    return res
      .status(200)
      .json({
        success: true,
        data: {
          range: {
            key: range.key,
            from:
              range.from
                ? range.from.toISOString()
                : null,
            to:
              range.to.toISOString(),
            timezone:
              range.timezone,
            bucket:
              range.bucket,
          },

          overview: {
            orders:
              readFacetCount(
                orders.total,
              ),
            appointments:
              readFacetCount(
                appointments.total,
              ),
            leads:
              readFacetCount(
                leads.total,
              ),
            contactMessages:
              readFacetCount(
                contacts.total,
              ),
            subscriberActivity:
              readFacetCount(
                subscribers.activityTotal,
              ),
          },

          currentSubscribers: {
            total:
              currentSubscriberTotal,
            ...currentSubscriberStatuses,
          },

          statusBreakdowns: {
            orders:
              readStatusBreakdown(
                orders.statuses,
                serviceOrderStatuses,
              ),
            appointments:
              readStatusBreakdown(
                appointments.statuses,
                APPOINTMENT_STATUSES,
              ),
            leads:
              readStatusBreakdown(
                leads.statuses,
                leadStatuses,
              ),
            contactMessages:
              readStatusBreakdown(
                contacts.statuses,
                contactMessageStatuses,
              ),
            subscribers:
              readStatusBreakdown(
                subscribers.activityStatuses,
                SUBSCRIBER_STATUSES,
              ),
          },

          trends,

          conversions: {
            contactMessagesToLeads:
              readConversion(
                contacts.conversion,
              ),
            appointmentsToLeads:
              readConversion(
                appointments.conversion,
              ),
            leadWonRate:
              readLeadWonRate(
                leads.wonRate,
              ),
          },

          leadSources:
            readLeadSources(
              leads.sources,
            ),

          estimatedPipelineValue:
            readPipelineValues(
              leads.pipelineValue,
            ),

          topOrderedServices:
            readTopServices(
              orders.topServices,
            ),
        },
      });
  } catch (error) {
    return next(error);
  }
}

export {
  ANALYTICS_RANGE_KEYS,
  getAdminAnalytics,
};
