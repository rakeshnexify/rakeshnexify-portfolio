const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicyDirectives = {
  defaultSrc: ["'self'"],

  baseUri: ["'self'"],

  connectSrc: ["'self'"],

  fontSrc: ["'self'", "data:"],

  formAction: ["'self'"],

  frameAncestors: ["'none'"],

  imgSrc: ["'self'", "data:", "blob:", "https:"],

  manifestSrc: ["'self'"],

  mediaSrc: ["'self'", "blob:", "https:"],

  objectSrc: ["'none'"],

  scriptSrc: ["'self'"],

  scriptSrcAttr: ["'none'"],

  styleSrc: ["'self'"],

  workerSrc: ["'self'", "blob:"],

  /*
   * Production HTTPS deployment me insecure
   * asset requests automatically HTTPS me upgrade honge.
   *
   * Development me localhost HTTP ko HTTPS me
   * force nahi karna hai.
   */
  upgradeInsecureRequests: isProduction ? [] : null,
};

const helmetOptions = {
  contentSecurityPolicy: {
    directives: contentSecurityPolicyDirectives,
  },

  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  strictTransportSecurity: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,

  xFrameOptions: {
    action: "deny",
  },
};

export { contentSecurityPolicyDirectives };

export default helmetOptions;
