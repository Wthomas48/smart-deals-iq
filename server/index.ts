import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { getDb, closeDb, testConnection } from "./db";
import { fallbackToMemStorage } from "./storage";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    // Custom allowed origins from environment (comma-separated)
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
        origins.add(origin.trim());
      });
    }

    // Production domains
    if (process.env.NODE_ENV === "production") {
      // Add your production domains here
      origins.add("https://smartdealsiq.com");
      origins.add("https://www.smartdealsiq.com");
      origins.add("https://api.smartdealsiq.com");
      // Railway deployment URLs
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        origins.add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      }
      // Allow custom CORS origins from environment
      if (process.env.CORS_ORIGINS) {
        process.env.CORS_ORIGINS.split(",").forEach((origin) => {
          origins.add(origin.trim());
        });
      }
      // Expo Go and mobile apps (EAS builds)
      origins.add("exp://");
    } else {
      // Development localhost origins
      // Expo web dev server
      origins.add("http://localhost:8081");
      origins.add("http://127.0.0.1:8081");
      origins.add("http://localhost:8082");
      origins.add("http://127.0.0.1:8082");
      // Backend server (for testing)
      origins.add("http://localhost:5000");
      origins.add("http://127.0.0.1:5000");
      // Alternative ports
      origins.add("http://localhost:3000");
      origins.add("http://127.0.0.1:3000");
      origins.add("http://localhost:19006");
      origins.add("http://127.0.0.1:19006");
      // LAN IP for mobile testing (update as needed)
      origins.add("http://192.168.0.220:8081");
      origins.add("http://192.168.0.220:5000");
    }

    const origin = req.header("origin");

    // Allow the request origin if it's in our allowed list
    // Also allow requests without origin (mobile apps, Postman, etc.)
    if (!origin || origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-user-id, X-User-Id");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function loadTemplate(name: string): string | null {
  const templatePath = path.resolve(process.cwd(), "server", "templates", name);
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf-8");
    }
  } catch {
    // Template not found
  }
  return null;
}

function configureExpoAndLanding(app: express.Application) {
  const landingPageTemplate = loadTemplate("landing-page.html");
  const billingPageTemplate = loadTemplate("vendor-billing.html");
  const paymentSuccessTemplate = loadTemplate("payment-success.html");
  const paymentCancelledTemplate = loadTemplate("payment-cancelled.html");

  if (landingPageTemplate) {
    log("Serving static Expo files with dynamic manifest routing");
  } else {
    log("[Server] Landing page template not found - API-only mode");
  }

  if (billingPageTemplate) {
    log("[Server] Vendor billing page loaded");
  }

  const appName = getAppName();

  // Stripe Payment Links - update these with your actual Payment Link URLs
  const PAYMENT_LINKS: Record<string, string> = {
    boost_24h: process.env.STRIPE_LINK_BOOST_24H || "https://buy.stripe.com/5kQaEY7Rvamk2ko2NN",
    boost_3d: process.env.STRIPE_LINK_BOOST_3D || "https://buy.stripe.com/5kQ5kE6Nrcusf7afAz",
    boost_7d: process.env.STRIPE_LINK_BOOST_7D || "https://buy.stripe.com/4gM9AU5Jn5204swdsr",
    pro_monthly: process.env.STRIPE_LINK_PRO_MONTHLY || "",
    pro_annual: process.env.STRIPE_LINK_PRO_ANNUAL || "",
    ad_30d: process.env.STRIPE_LINK_AD_30D || "",
    ad_annual: process.env.STRIPE_LINK_AD_ANNUAL || "",
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Vendor billing page
    if (req.path === "/vendor/billing" && billingPageTemplate) {
      let html = billingPageTemplate;
      // Replace payment link placeholders with actual Stripe Payment Links
      html = html.replace(/BOOST_24H_LINK/g, PAYMENT_LINKS.boost_24h || "#");
      html = html.replace(/BOOST_3D_LINK/g, PAYMENT_LINKS.boost_3d || "#");
      html = html.replace(/BOOST_7D_LINK/g, PAYMENT_LINKS.boost_7d || "#");
      html = html.replace(/PRO_MONTHLY_LINK/g, PAYMENT_LINKS.pro_monthly || "#");
      html = html.replace(/PRO_ANNUAL_LINK/g, PAYMENT_LINKS.pro_annual || "#");
      html = html.replace(/AD_30D_LINK/g, PAYMENT_LINKS.ad_30d || "#");
      html = html.replace(/AD_ANNUAL_LINK/g, PAYMENT_LINKS.ad_annual || "#");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }

    // Payment success page
    if (req.path === "/payment-success" && paymentSuccessTemplate) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(paymentSuccessTemplate);
    }

    // Payment cancelled page
    if (req.path === "/payment-cancelled" && paymentCancelledTemplate) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(paymentCancelledTemplate);
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/" && landingPageTemplate) {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    // If no landing page, return API info
    if (req.path === "/") {
      return res.json({
        name: "SmartDealsIQ API",
        version: "1.0.0",
        status: "running",
        endpoints: {
          health: "/api/health",
          auth: "/api/auth/*",
          vendors: "/api/vendors/*",
          payments: "/api/payments/*",
        },
      });
    }

    next();
  });

  // Only serve static files if directories exist
  const assetsPath = path.resolve(process.cwd(), "assets");
  const staticBuildPath = path.resolve(process.cwd(), "static-build");

  if (fs.existsSync(assetsPath)) {
    app.use("/assets", express.static(assetsPath));
  }
  if (fs.existsSync(staticBuildPath)) {
    app.use(express.static(staticBuildPath));
  }

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(status).json({ message });

    throw err;
  });
}

(async () => {
  // Initialize database connection
  log("[Server] Initializing...");

  // Test database connection (non-blocking in development)
  const db = getDb();
  if (db) {
    const connected = await testConnection();
    if (connected) {
      log("[Server] Database connected successfully");
    } else {
      if (process.env.NODE_ENV === "production") {
        log("[Server] ERROR: Database connection failed in production");
        process.exit(1);
      }
      log("[Server] Database connection failed - falling back to in-memory storage");
      fallbackToMemStorage();
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      log("[Server] ERROR: DATABASE_URL required in production");
      process.exit(1);
    }
    log("[Server] No database configured - using in-memory storage");
    fallbackToMemStorage();
  }

  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  // Use 0.0.0.0 to allow mobile devices to connect via LAN
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    log(`[Server] Running on http://${host}:${port}`);
    log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    log(`\n[Server] ${signal} received, shutting down gracefully...`);

    server.close(async () => {
      log("[Server] HTTP server closed");
      await closeDb();
      log("[Server] Shutdown complete");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      log("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})();
