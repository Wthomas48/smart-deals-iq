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
        const o = origin.trim();
        if (o) origins.add(o);
      });
    }

    if (process.env.NODE_ENV === "production") {
      origins.add("https://smartdealsiq.com");
      origins.add("https://www.smartdealsiq.com");
      origins.add("https://api.smartdealsiq.com");

      // Railway deployment URL
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        origins.add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      }

      // Optional extra origins
      if (process.env.CORS_ORIGINS) {
        process.env.CORS_ORIGINS.split(",").forEach((origin) => {
          const o = origin.trim();
          if (o) origins.add(o);
        });
      }

      // Expo scheme (does not match normal Origin headers, but harmless)
      origins.add("exp://");
    } else {
      // Dev origins
      origins.add("http://localhost:8081");
      origins.add("http://127.0.0.1:8081");
      origins.add("http://localhost:8082");
      origins.add("http://127.0.0.1:8082");
      origins.add("http://localhost:5000");
      origins.add("http://127.0.0.1:5000");
      origins.add("http://localhost:3000");
      origins.add("http://127.0.0.1:3000");
      origins.add("http://localhost:19006");
      origins.add("http://127.0.0.1:19006");

      // LAN (optional)
      origins.add("http://192.168.0.220:8081");
      origins.add("http://192.168.0.220:5000");
    }

    const origin = req.header("origin");

    // Allow requests with no origin (server-to-server, Postman, mobile)
    if (!origin || origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, x-user-id, X-User-Id",
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  // Capture raw body for Stripe signature verification (webhooks)
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
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson: any, ...args: any[]) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson, ...args);
    }) as any;

    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";

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
  const manifestPath = path.resolve(process.cwd(), "static-build", platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
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
    // ignore
  }
  return null;
}

function configureExpoAndLanding(app: express.Application) {
  const landingPageTemplate = loadTemplate("landing-page.html");
  const billingPageTemplate = loadTemplate("vendor-billing.html");
  const paymentSuccessTemplate = loadTemplate("payment-success.html");
  const paymentCancelledTemplate = loadTemplate("payment-cancelled.html");

  const appName = getAppName();

  if (landingPageTemplate) {
    log("[Server] Landing page template loaded");
  } else {
    log("[Server] Landing page template missing - API-only mode");
  }

  if (billingPageTemplate) log("[Server] Vendor billing page loaded");
  if (paymentSuccessTemplate) log("[Server] Payment success template loaded");
  if (paymentCancelledTemplate) log("[Server] Payment cancelled template loaded");

  // Stripe Payment Links (if you use Payment Links)
  const PAYMENT_LINKS: Record<string, string> = {
    boost_24h: process.env.STRIPE_LINK_BOOST_24H || "",
    boost_3d: process.env.STRIPE_LINK_BOOST_3D || "",
    boost_7d: process.env.STRIPE_LINK_BOOST_7D || "",
    pro_monthly: process.env.STRIPE_LINK_PRO_MONTHLY || "",
    pro_annual: process.env.STRIPE_LINK_PRO_ANNUAL || "",
    ad_30d: process.env.STRIPE_LINK_AD_30D || "",
    ad_annual: process.env.STRIPE_LINK_AD_ANNUAL || "",
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Let API routes pass through
    if (req.path.startsWith("/api")) return next();

    // Vendor billing page
    if (req.path === "/vendor/billing" && billingPageTemplate) {
      let html = billingPageTemplate;

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

    // Expo manifest routing (only for / or /manifest)
    if (req.path !== "/" && req.path !== "/manifest") return next();

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    // Root route
    if (req.path === "/" && landingPageTemplate) {
      return serveLandingPage({ req, res, landingPageTemplate, appName });
    }

    // No landing template -> JSON info
    if (req.path === "/") {
      return res.status(200).json({
        ok: true,
        name: "SmartDealsIQ API",
        status: "running",
        endpoints: {
          health: "/api/health",
          webhook: "/api/billing/webhook",
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  });

  // Serve static only if dirs exist
  const assetsPath = path.resolve(process.cwd(), "assets");
  const staticBuildPath = path.resolve(process.cwd(), "static-build");

  if (fs.existsSync(assetsPath)) app.use("/assets", express.static(assetsPath));
  if (fs.existsSync(staticBuildPath)) app.use(express.static(staticBuildPath));

  log("[Server] Expo routing configured");
}

function setupApiHealth(app: express.Application) {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string };
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(status).json({ message });

    // Re-throw so Railway logs show the stack
    throw err;
  });
}

(async () => {
  log("[Server] Initializing...");

  // DB init
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
  setupApiHealth(app);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    log(`[Server] Running on http://${host}:${port}`);
    log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
  });

  const shutdown = async (signal: string) => {
    log(`\n[Server] ${signal} received, shutting down gracefully...`);

    server.close(async () => {
      log("[Server] HTTP server closed");
      await closeDb();
      log("[Server] Shutdown complete");
      process.exit(0);
    });

    setTimeout(() => {
      log("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})();     
    



 


