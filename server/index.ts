import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: Buffer;
  }
}

// Middleware global para JSON
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Logger de requisições
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const { registerAuthRoutes } = await import("./routes/authRoutes");
  const { registerWebhookRoutes } = await import("./routes/webhookRoutes");
  const { creditsCheckMiddleware } = await import("./middleware/creditsMiddleware");
  const { authMiddleware } = await import("./middleware/authMiddleware");
  const { storage } = await import("./storage");
  const { createKiwifyService } = await import("./services/kiwifyService");

  const kiwifyService = await createKiwifyService();

  // Rotas de autenticação (✅ agora passando storage)
  await registerAuthRoutes(app, storage);

  // Rotas de webhook (Kiwify)
  await registerWebhookRoutes(app, storage, kiwifyService);
  console.log("✅ Webhook da Kiwify registrado em /api/webhook/kiwify");

  // Middleware de créditos para rotas protegidas
  function protectedRoute(req: Request, res: Response, next: NextFunction) {
    authMiddleware(req, res, () => creditsCheckMiddleware(req, res, next));
  }

  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api/chat") ||
      req.path.startsWith("/api/image") ||
      req.path.startsWith("/api/prompt") ||
      req.path.startsWith("/api/video")
    ) {
      return protectedRoute(req, res, next);
    }
    next();
  });

  // ➕ Nova rota de download segura
  app.get("/api/download/:id", (req: Request, res: Response) => {
    const filePath = path.join(__dirname, "storage/videos", req.params.id + ".mp4");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Vídeo não encontrado" });
    }

    res.download(filePath, "Video gerado.mp4");
  });

  // Outras rotas (chat, prompt, image, video)
  await registerRoutes(httpServer, app);

  // Middleware de erro
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("🔥 Express error:", err);
    res.status(status).json({ message });
  });

  // Static ou Vite
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Porta
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Servidor rodando na porta ${port}`);
    },
  );
})();
