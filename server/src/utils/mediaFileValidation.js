import path from "node:path";
import {
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";

import {
  FileTypeParser,
} from "file-type";

import {
  detectXml,
} from "@file-type/xml";

import sanitizeHtml from "sanitize-html";

const MEGABYTE = 1024 * 1024;

const DEFAULT_MEDIA_LIMITS_MB = Object.freeze({
  image: 10,
  svg: 5,
  document: 20,
  audio: 50,
  video: 100,
});

const MEDIA_LIMIT_ENVIRONMENT_VARIABLES = Object.freeze({
  image: "MEDIA_IMAGE_MAX_MB",
  svg: "MEDIA_SVG_MAX_MB",
  document: "MEDIA_DOCUMENT_MAX_MB",
  audio: "MEDIA_AUDIO_MAX_MB",
  video: "MEDIA_VIDEO_MAX_MB",
});

const DANGEROUS_FILENAME_EXTENSIONS = new Set([
  "asp",
  "aspx",
  "bat",
  "bash",
  "cgi",
  "cmd",
  "com",
  "cpl",
  "dll",
  "exe",
  "html",
  "htm",
  "jar",
  "js",
  "jsp",
  "mjs",
  "cjs",
  "msi",
  "php",
  "php3",
  "php4",
  "php5",
  "phtml",
  "phar",
  "pl",
  "ps1",
  "py",
  "rb",
  "sh",
  "vbs",
  "wasm",
  "xhtml",
]);

const ALLOWED_MEDIA_FORMATS = Object.freeze({
  jpg: Object.freeze({
    extensions: Object.freeze(["jpg", "jpeg"]),
    detectedMimes: Object.freeze([
      "image/jpeg",
    ]),
    browserMimes: Object.freeze([
      "image/jpeg",
      "image/jpg",
    ]),
    mediaType: "image",
    providerResourceType: "image",
  }),

  png: Object.freeze({
    extensions: Object.freeze(["png"]),
    detectedMimes: Object.freeze([
      "image/png",
    ]),
    browserMimes: Object.freeze([
      "image/png",
    ]),
    mediaType: "image",
    providerResourceType: "image",
  }),

  webp: Object.freeze({
    extensions: Object.freeze(["webp"]),
    detectedMimes: Object.freeze([
      "image/webp",
    ]),
    browserMimes: Object.freeze([
      "image/webp",
    ]),
    mediaType: "image",
    providerResourceType: "image",
  }),

  avif: Object.freeze({
    extensions: Object.freeze(["avif"]),
    detectedMimes: Object.freeze([
      "image/avif",
    ]),
    browserMimes: Object.freeze([
      "image/avif",
    ]),
    mediaType: "image",
    providerResourceType: "image",
  }),

  svg: Object.freeze({
    extensions: Object.freeze(["svg"]),
    detectedMimes: Object.freeze([
      "image/svg+xml",
    ]),
    browserMimes: Object.freeze([
      "image/svg+xml",
    ]),
    mediaType: "svg",
    providerResourceType: "image",
  }),

  pdf: Object.freeze({
    extensions: Object.freeze(["pdf"]),
    detectedMimes: Object.freeze([
      "application/pdf",
    ]),
    browserMimes: Object.freeze([
      "application/pdf",
    ]),
    mediaType: "document",
    providerResourceType: "raw",
  }),

  mp3: Object.freeze({
    extensions: Object.freeze(["mp3"]),
    detectedMimes: Object.freeze([
      "audio/mpeg",
    ]),
    browserMimes: Object.freeze([
      "audio/mpeg",
      "audio/mp3",
    ]),
    mediaType: "audio",
    providerResourceType: "video",
  }),

  wav: Object.freeze({
    extensions: Object.freeze(["wav"]),
    detectedMimes: Object.freeze([
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
    ]),
    browserMimes: Object.freeze([
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/x-pn-wav",
    ]),
    mediaType: "audio",
    providerResourceType: "video",
  }),

  ogg: Object.freeze({
    extensions: Object.freeze(["ogg"]),
    detectedMimes: Object.freeze([
      "audio/ogg",
      "application/ogg",
    ]),
    browserMimes: Object.freeze([
      "audio/ogg",
      "application/ogg",
    ]),
    mediaType: "audio",
    providerResourceType: "video",
  }),

  m4a: Object.freeze({
    extensions: Object.freeze(["m4a"]),
    detectedMimes: Object.freeze([
      "audio/mp4",
      "audio/x-m4a",
    ]),
    browserMimes: Object.freeze([
      "audio/mp4",
      "audio/x-m4a",
      "audio/m4a",
      "video/mp4",
    ]),
    mediaType: "audio",
    providerResourceType: "video",
  }),

  mp4: Object.freeze({
    extensions: Object.freeze(["mp4"]),
    detectedMimes: Object.freeze([
      "video/mp4",
    ]),
    browserMimes: Object.freeze([
      "video/mp4",
    ]),
    mediaType: "video",
    providerResourceType: "video",
  }),

  webm: Object.freeze({
    extensions: Object.freeze(["webm"]),
    detectedMimes: Object.freeze([
      "video/webm",
    ]),
    browserMimes: Object.freeze([
      "video/webm",
    ]),
    mediaType: "video",
    providerResourceType: "video",
  }),
});

const SVG_ALLOWED_TAGS = Object.freeze([
  "svg",
  "g",
  "defs",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "pattern",
  "symbol",
  "use","title",
  "desc",
  "text",
  "tspan",
]);

const SVG_GLOBAL_ATTRIBUTES = Object.freeze([
  "id",
  "class",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "transform",
  "clip-path",
  "mask",
  "display",
  "visibility",
]);

const SVG_ALLOWED_ATTRIBUTES = Object.freeze({
  svg: [
    "xmlns",
    "xmlns:xlink",
    "width",
    "height",
    "viewBox",
    "preserveAspectRatio",
    "fill",
    "stroke",
    "role",
    "aria-label",
    "aria-labelledby",
    "focusable",
  ],

  g: SVG_GLOBAL_ATTRIBUTES,

  defs: [
    "id",
  ],

  path: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "d",
    "pathLength",
  ],

  rect: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "x",
    "y",
    "width",
    "height",
    "rx",
    "ry",
  ],

  circle: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "cx",
    "cy",
    "r",
  ],

  ellipse: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "cx",
    "cy",
    "rx",
    "ry",
  ],

  line: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "x1",
    "y1",
    "x2",
    "y2",
  ],

  polyline: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "points",
  ],

  polygon: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "points",
  ],

  linearGradient: [
    "id",
    "x1",
    "y1",
    "x2",
    "y2",
    "gradientUnits",
    "gradientTransform",
    "spreadMethod",
  ],

  radialGradient: [
    "id",
    "cx",
    "cy",
    "r",
    "fx",
    "fy",
    "fr",
    "gradientUnits",
    "gradientTransform",
    "spreadMethod",
  ],

  stop: [
    "id",
    "offset",
    "stop-color",
    "stop-opacity",
  ],

  clipPath: [
    "id",
    "clipPathUnits",
    "transform",
  ],

  mask: [
    "id",
    "x",
    "y",
    "width",
    "height",
    "maskUnits",
    "maskContentUnits",
  ],

  pattern: [
    "id",
    "x",
    "y",
    "width",
    "height",
    "viewBox",
    "preserveAspectRatio",
    "patternUnits",
    "patternContentUnits",
    "patternTransform",
  ],

  symbol: [
    "id",
    "viewBox",
    "preserveAspectRatio",
  ],
  use: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "x",
    "y",
    "width",
    "height",
    "href",
    "xlink:href",
  ],

  title: [],

  desc: [],

  text: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "x",
    "y",
    "dx",
    "dy",
    "text-anchor",
    "font-family",
    "font-size",
    "font-weight",
  ],

  tspan: [
    ...SVG_GLOBAL_ATTRIBUTES,
    "x",
    "y",
    "dx",
    "dy",
  ],

  "*": [
    "aria-hidden",
  ],
});

const SVG_HARD_REJECT_PATTERNS = Object.freeze([
  /<!doctype\b/i,
  /<!entity\b/i,
  /<\?xml-stylesheet\b/i,
]);

const SVG_LOCAL_FRAGMENT_PATTERN =
  /^#[A-Za-z_][A-Za-z0-9_.:-]*$/;

const SVG_URL_REFERENCE_PATTERN =
  /url\(\s*["']?([^"')\s]+)["']?\s*\)/gi;

const SVG_POST_SANITIZE_FORBIDDEN_PATTERNS = Object.freeze([
  /<script\b/i,
  /<foreignObject\b/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<audio\b/i,
  /<video\b/i,
  /<image\b/i,
  /<a\b/i,
  /<style\b/i,
  /<animate\b/i,
  /<animateMotion\b/i,
  /<animateTransform\b/i,
  /<set\b/i,
  /<link\b/i,
  /<meta\b/i,
  /<base\b/i,
  /<form\b/i,
  /\son[a-z]+\s*=/i,
  /\ssrc\s*=/i,
  /\sstyle\s*=/i,
]);

const SVG_SAFE_STYLE_PROPERTIES = Object.freeze(
  new Set([
    "fill",
    "fill-opacity",
    "fill-rule",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "opacity",
    "clip-path",
    "mask",
    "display",
    "visibility",
    "stop-color",
    "stop-opacity",
    "text-anchor",
    "font-family",
    "font-size",
    "font-weight",
  ]),
);

function normalizeMimeType(value) {
  return String(value ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function getFileExtension(fileName) {
  return path
    .extname(String(fileName ?? ""))
    .slice(1)
    .trim()
    .toLowerCase();
}

function normalizeOriginalFileName(fileName) {
  const rawFileName = path.basename(
    String(fileName ?? "")
      .replaceAll("\0", "")
      .trim(),
  );

  const normalized = rawFileName
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    throw new Error(
      "Uploaded file must have a valid filename.",
    );
  }

  if (normalized.length > 255) {
    throw new Error(
      "Uploaded filename cannot exceed 255 characters.",
    );
  }

  return normalized;
}

function assertNoDangerousDoubleExtension(fileName) {
  const normalizedFileName = normalizeOriginalFileName(fileName);

  const parts = normalizedFileName
    .toLowerCase()
    .split(".")
    .filter(Boolean);

  if (parts.length <= 2) {
    return;
  }

  const intermediateExtensions = parts.slice(1, -1);

  const dangerousExtension =
    intermediateExtensions.find((extension) =>
      DANGEROUS_FILENAME_EXTENSIONS.has(extension),
    );

  if (dangerousExtension) {
    throw new Error(
      `Uploaded filename contains a prohibited intermediate extension: .${dangerousExtension}.`,
    );
  }
}

function readConfiguredLimitMb(mediaType) {
  const variableName =
    MEDIA_LIMIT_ENVIRONMENT_VARIABLES[mediaType];

  const defaultValue =
    DEFAULT_MEDIA_LIMITS_MB[mediaType];

  const rawValue = String(
    process.env[variableName] ?? "",
  ).trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0 ||
    parsedValue > 500
  ) {
    return defaultValue;
  }

  return parsedValue;
}

function getMediaLimitBytes(mediaType) {
  const megabytes =
    readConfiguredLimitMb(mediaType);

  return Math.round(
    megabytes * MEGABYTE,
  );
}

function getMaximumUploadBytes() {
  return Math.max(
    ...Object.keys(
      DEFAULT_MEDIA_LIMITS_MB,
    ).map((mediaType) =>
      getMediaLimitBytes(mediaType),
    ),
  );
}

function getFormatConfiguration(
  detectedExtension,
  detectedMimeType,
) {
  const extension = String(
    detectedExtension ?? "",
  )
    .trim()
    .toLowerCase();

  const mimeType =
    normalizeMimeType(detectedMimeType);

  const format =
    ALLOWED_MEDIA_FORMATS[extension];

  if (!format) {
    return null;
  }

  if (
    !format.detectedMimes.includes(mimeType)
  ) {
    return null;
  }

  return format;
}

function validateBrowserMimeType(
  format,
  browserMimeType,
) {
  const normalizedBrowserMime =
    normalizeMimeType(browserMimeType);

  if (!normalizedBrowserMime) {
    return;
  }

  if (
    normalizedBrowserMime ===
    "application/octet-stream"
  ) {
    return;
  }

  if (
    !format.browserMimes.includes(
      normalizedBrowserMime,
    )
  ) {
    throw new Error(
      "Browser-reported file type does not match the detected uploaded file type.",
    );
  }
}

function validateOriginalExtension(
  format,
  originalName,
) {
  const originalExtension =
    getFileExtension(originalName);

  if (!originalExtension) {
    throw new Error(
      "Uploaded file must include a supported file extension.",
    );
  }

  if (
    !format.extensions.includes(
      originalExtension,
    )
  ) {
    throw new Error(
      "Uploaded filename extension does not match the detected file type.",
    );
  }

  return originalExtension;
}

function assertSvgSourceCanBeSanitized(svgSource) {
  const source = String(svgSource ?? "");

  if (!source.trim()) {
    throw new Error(
      "SVG file cannot be empty.",
    );
  }

  for (
    const pattern of
      SVG_HARD_REJECT_PATTERNS
  ) {
    if (pattern.test(source)) {
      throw new Error(
        "SVG contains a prohibited document declaration.",
      );
    }
  }
}

function isSafeLocalSvgFragment(value) {
  return SVG_LOCAL_FRAGMENT_PATTERN.test(
    String(value ?? "").trim(),
  );
}

function hasOnlySafeSvgUrlReferences(value) {
  const source = String(value ?? "");

  SVG_URL_REFERENCE_PATTERN.lastIndex = 0;

  let match;

  while (
    (
      match =
        SVG_URL_REFERENCE_PATTERN.exec(
          source,
        )
    )
  ) {
    if (
      !isSafeLocalSvgFragment(
        match[1],
      )
    ) {
      return false;
    }
  }

  return true;
}

function sanitizeSvgAttributes(
  attributes = {},
) {
  const sanitizedAttributes = {};
  let inlineStyleSource = "";

  Object.entries(attributes).forEach(
    ([attributeName, rawValue]) => {
      const normalizedName =
        String(attributeName)
          .trim()
          .toLowerCase();

      const value = String(
        rawValue ?? "",
      );

      if (
        !normalizedName ||
        normalizedName === "src" ||
        normalizedName.startsWith("on")
      ) {
        return;
      }

      if (
        normalizedName === "style"
      ) {
        inlineStyleSource = value;
        return;
      }

      if (
        normalizedName === "href" ||
        normalizedName === "xlink:href"
      ) {
        if (
          isSafeLocalSvgFragment(value)
        ) {
          sanitizedAttributes[
            attributeName
          ] = value.trim();
        }

        return;
      }

      if (
        /javascript\s*:/i.test(value) ||
        /vbscript\s*:/i.test(value) ||
        /data\s*:/i.test(value) ||
        /expression\s*\(/i.test(value) ||
        /@import\b/i.test(value)
      ) {
        return;
      }

      if (
        !hasOnlySafeSvgUrlReferences(
          value,
        )
      ) {
        return;
      }

      sanitizedAttributes[
        attributeName
      ] = value;
    },
  );

  if (inlineStyleSource) {
    Object.assign(
      sanitizedAttributes,
      parseSafeSvgStyleDeclarations(
        inlineStyleSource,
      ),
    );
  }

  return sanitizedAttributes;
}

function createSvgTransformTags() {
  return Object.fromEntries(
    SVG_ALLOWED_TAGS.map(
      (allowedTagName) => [
        allowedTagName,
        (
          tagName,
          attributes,
        ) => ({
          tagName,
          attribs:
            sanitizeSvgAttributes(
              attributes,
            ),
        }),
      ],
    ),
  );
}

function isSafeSvgStyleValue(value) {
  const normalizedValue = String(
    value ?? "",
  ).trim();

  if (
    !normalizedValue ||
    normalizedValue.length > 512
  ) {
    return false;
  }

  if (
    /javascript\s*:/i.test(
      normalizedValue,
    ) ||
    /vbscript\s*:/i.test(
      normalizedValue,
    ) ||
    /data\s*:/i.test(
      normalizedValue,
    ) ||
    /expression\s*\(/i.test(
      normalizedValue,
    ) ||
    /@import\b/i.test(
      normalizedValue,
    ) ||
    /behavior\s*:/i.test(
      normalizedValue,
    ) ||
    /-moz-binding\s*:/i.test(
      normalizedValue,
    )
  ) {
    return false;
  }

  return hasOnlySafeSvgUrlReferences(
    normalizedValue,
  );
}

function parseSafeSvgStyleDeclarations(
  declarationSource,
) {
  const declarations = {};

  String(declarationSource ?? "")
    .split(";")
    .forEach((declaration) => {
      const separatorIndex =
        declaration.indexOf(":");

      if (separatorIndex <= 0) {
        return;
      }

      const propertyName =
        declaration
          .slice(0, separatorIndex)
          .trim()
          .toLowerCase();

      let propertyValue =
        declaration
          .slice(separatorIndex + 1)
          .trim();

      propertyValue =
        propertyValue.replace(
          /\s*!important\s*$/i,
          "",
        );

      if (
        !SVG_SAFE_STYLE_PROPERTIES.has(
          propertyName,
        ) ||
        !isSafeSvgStyleValue(
          propertyValue,
        )
      ) {
        return;
      }

      declarations[propertyName] =
        propertyValue;
    });

  return declarations;
}

function extractSafeSvgClassStyleRules(
  svgSource,
) {
  const rules = [];

  const styleBlockPattern =
    /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;

  let styleBlockMatch;

  while (
    (
      styleBlockMatch =
        styleBlockPattern.exec(
          String(svgSource ?? ""),
        )
    )
  ) {
    const styleSource =
      String(
        styleBlockMatch[1] ?? "",
      ).replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );

    const rulePattern =
      /([^{}]+)\{([^{}]*)\}/g;

    let ruleMatch;

    while (
      (
        ruleMatch =
          rulePattern.exec(
            styleSource,
          )
      )
    ) {
      const selectors =
        String(
          ruleMatch[1] ?? "",
        )
          .split(",")
          .map((selector) =>
            selector.trim(),
          )
          .filter((selector) =>
            /^\.[A-Za-z_][A-Za-z0-9_-]*$/.test(
              selector,
            ),
          )
          .map((selector) =>
            selector.slice(1),
          );

      if (selectors.length === 0) {
        continue;
      }

      const declarations =
        parseSafeSvgStyleDeclarations(
          ruleMatch[2],
        );

      if (
        Object.keys(
          declarations,
        ).length === 0
      ) {
        continue;
      }

      rules.push({
        classNames:
          new Set(selectors),
        declarations,
      });
    }
  }

  return rules;
}

function escapeSvgAttributeValue(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setSvgPresentationAttribute(
  tagSource,
  attributeName,
  attributeValue,
) {
  const escapedValue =
    escapeSvgAttributeValue(
      attributeValue,
    );

  const escapedAttributeName =
    String(attributeName).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const existingAttributePattern =
    new RegExp(
      `\\s${escapedAttributeName}\\s*=\\s*(["'])[^"']*\\1`,
      "i",
    );

  if (
    existingAttributePattern.test(
      tagSource,
    )
  ) {
    return tagSource.replace(
      existingAttributePattern,
      ` ${attributeName}="${escapedValue}"`,
    );
  }

  return tagSource.replace(
    /\s*\/?>$/,
    (closingSource) => {
      const isSelfClosing =
        /\/>$/.test(
          closingSource,
        );

      return (
        ` ${attributeName}="${escapedValue}"` +
        (
          isSelfClosing
            ? " />"
            : ">"
        )
      );
    },
  );
}

function inlineSafeSvgClassStyles(
  svgSource,
) {
  const source = String(
    svgSource ?? "",
  );

  const rules =
    extractSafeSvgClassStyleRules(
      source,
    );

  const sourceWithoutStyleBlocks =
    source.replace(
      /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,
      "",
    );

  if (rules.length === 0) {
    return sourceWithoutStyleBlocks;
  }

  return sourceWithoutStyleBlocks.replace(
    /<[A-Za-z][A-Za-z0-9:-]*(?:\s[^<>]*?)?\/?>/g,
    (tagSource) => {
      const classMatch =
        tagSource.match(
          /\sclass\s*=\s*(["'])(.*?)\1/i,
        );

      if (!classMatch) {
        return tagSource;
      }

      const classNames =
        new Set(
          String(
            classMatch[2] ?? "",
          )
            .trim()
            .split(/\s+/)
            .filter(Boolean),
        );

      const computedStyle = {};

      rules.forEach((rule) => {
        const matchesRule =
          Array.from(
            rule.classNames,
          ).some((className) =>
            classNames.has(
              className,
            ),
          );

        if (matchesRule) {
          Object.assign(
            computedStyle,
            rule.declarations,
          );
        }
      });

      return Object.entries(
        computedStyle,
      ).reduce(
        (
          currentTagSource,
          [
            attributeName,
            attributeValue,
          ],
        ) =>
          setSvgPresentationAttribute(
            currentTagSource,
            attributeName,
            attributeValue,
          ),
        tagSource,
      );
    },
  );
}

function hasSafeSvgDrawableContent(
  svgSource,
) {
  const source = String(
    svgSource ?? "",
  );

  if (
    /<(?:path|rect|circle|ellipse|line|polyline|polygon|text)\b/i.test(
      source,
    )
  ) {
    return true;
  }

  return /<use\b[^>]*(?:href|xlink:href)\s*=\s*["']#[A-Za-z_][A-Za-z0-9_.:-]*["']/i.test(
    source,
  );
}

function assertSanitizedSvgSource(
  svgSource,
) {
  const source = String(
    svgSource ?? "",
  );

  if (
    !/^<svg(?:\s|>)/.test(source)
  ) {
    throw new Error(
      "Uploaded SVG must contain a valid SVG root element.",
    );
  }

  for (
    const pattern of
      SVG_POST_SANITIZE_FORBIDDEN_PATTERNS
  ) {
    if (pattern.test(source)) {
      throw new Error(
        "SVG still contains prohibited active content after sanitization.",
      );
    }
  }

  const referencePattern =
    /\s(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi;

  let referenceMatch;

  while (
    (
      referenceMatch =
        referencePattern.exec(source)
    )
  ) {
    if (
      !isSafeLocalSvgFragment(
        referenceMatch[1],
      )
    ) {
      throw new Error(
        "SVG may only use local fragment references.",
      );
    }
  }

  if (
    !hasOnlySafeSvgUrlReferences(
      source,
    )
  ) {
    throw new Error(
      "SVG may only use local fragment URL references.",
    );
  }

  if (
    !hasSafeSvgDrawableContent(
      source,
    )
  ) {
    throw new Error(
      "SVG contains no safe drawable content after sanitization.",
    );
  }
}

function sanitizeSvgSource(svgSource) {
  assertSvgSourceCanBeSanitized(
    svgSource,
  );

  const sourceWithSafeClassStyles =
    inlineSafeSvgClassStyles(
      svgSource,
    );

  const sanitized = sanitizeHtml(
    sourceWithSafeClassStyles,
    {
      allowedTags: SVG_ALLOWED_TAGS,

      allowedAttributes:
        SVG_ALLOWED_ATTRIBUTES,

      allowedSchemes: [],

      allowProtocolRelative: false,

      disallowedTagsMode:
        "discard",

      parseStyleAttributes: false,

      transformTags:
        createSvgTransformTags(),

      parser: {
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
      },

      nonTextTags: [
        "style",
        "script",
        "textarea",
        "option",
        "xmp",
        "noscript",
        "iframe",
        "object",
        "embed",
        "foreignObject",
        "audio",
        "video",
      ],
    },
  ).trim();

  assertSanitizedSvgSource(
    sanitized,
  );

  return sanitized;
}

async function detectMediaFileType(
  filePath,
) {
  const parser = new FileTypeParser({
    customDetectors: [
      detectXml,
    ],
  });

  try {
    return await parser.fromFile(
      filePath,
    );
  } catch {
    throw new Error(
      "Uploaded file type could not be safely detected.",
    );
  }
}

async function sanitizeSvgFile(
  filePath,
) {
  let source;

  try {
    source = await readFile(
      filePath,
      "utf8",
    );
  } catch {
    throw new Error(
      "Uploaded SVG could not be read safely.",
    );
  }

  const sanitized =
    sanitizeSvgSource(source);

  try {
    await writeFile(
      filePath,
      `${sanitized}\n`,
      "utf8",
    );
  } catch {
    throw new Error(
      "Sanitized SVG could not be prepared for upload.",
    );
  }
}

async function validateMediaFile({
  filePath,
  originalName,
  browserMimeType = "",
}) {
  const normalizedOriginalName =
    normalizeOriginalFileName(
      originalName,
    );

  assertNoDangerousDoubleExtension(
    normalizedOriginalName,
  );

  let fileStats;

  try {
    fileStats = await stat(filePath);
  } catch {
    throw new Error(
      "Temporary uploaded file could not be inspected.",
    );
  }

  if (
    !fileStats.isFile() ||
    fileStats.size <= 0
  ) {
    throw new Error(
      "Uploaded file is empty or invalid.",
    );
  }

  if (
    fileStats.size >
    getMaximumUploadBytes()
  ) {
    throw new Error(
      "Uploaded file exceeds the maximum allowed upload size.",
    );
  }

  const detectedType =
    await detectMediaFileType(
      filePath,
    );

  if (
    !detectedType?.ext ||
    !detectedType?.mime
  ) {
    throw new Error(
      "Unsupported or unrecognized file type.",
    );
  }

  const detectedExtension =
    String(detectedType.ext)
      .trim()
      .toLowerCase();

  const detectedMimeType =
    normalizeMimeType(
      detectedType.mime,
    );

  const format =
    getFormatConfiguration(
      detectedExtension,
      detectedMimeType,
    );

  if (!format) {
    throw new Error(
      "This file type is not allowed in the Media library.",
    );
  }

  const originalExtension =
    validateOriginalExtension(
      format,
      normalizedOriginalName,
    );

  validateBrowserMimeType(
    format,
    browserMimeType,
  );

  const typeLimitBytes =
    getMediaLimitBytes(
      format.mediaType,
    );

  if (
    fileStats.size >
    typeLimitBytes
  ) {
    const maxMb =
      readConfiguredLimitMb(
        format.mediaType,
      );

    throw new Error(
      `${format.mediaType} files cannot exceed ${maxMb} MB.`,
    );
  }

  if (
    format.mediaType === "svg"
  ) {
    await sanitizeSvgFile(
      filePath,
    );

    fileStats = await stat(
      filePath,
    );

    if (
      fileStats.size >
      typeLimitBytes
    ) {
      throw new Error(
        "Sanitized SVG exceeds the configured SVG size limit.",
      );
    }
  }

  return {
    originalName:
      normalizedOriginalName,

    extension:
      originalExtension,

    detectedExtension,

    mimeType:
      detectedMimeType,

    mediaType:
      format.mediaType,

    providerResourceType:
      format.providerResourceType,

    size:
      fileStats.size,
  };
}

function getSupportedMediaSummary() {
  return Object.freeze({
    image: Object.freeze([
      "jpg",
      "jpeg",
      "png",
      "webp",
      "avif",
    ]),

    svg: Object.freeze([
      "svg",
    ]),

    document: Object.freeze([
      "pdf",
    ]),

    audio: Object.freeze([
      "mp3",
      "wav",
      "ogg",
      "m4a",
    ]),

    video: Object.freeze([
      "mp4",
      "webm",
    ]),
  });
}

export {
  ALLOWED_MEDIA_FORMATS,
  DEFAULT_MEDIA_LIMITS_MB,
  DANGEROUS_FILENAME_EXTENSIONS,
  MEDIA_LIMIT_ENVIRONMENT_VARIABLES,
  getFileExtension,
  getMaximumUploadBytes,
  getMediaLimitBytes,
  getSupportedMediaSummary,
  normalizeMimeType,
  normalizeOriginalFileName,
  sanitizeSvgSource,
  validateMediaFile,
};

export default validateMediaFile;