import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { initMailerLite } from "./mailerlite";
import compression from "compression";

// Load environment variables from .env file
dotenv.config();

// Initialize MailerLite API client
initMailerLite();

const app = express();

// Configuração de cabeçalhos para segurança e performance
app.use((req, res, next) => {
  // Cabeçalhos de cache para melhorar performance
  if (req.method === 'GET') {
    // Diferentes estratégias de cache baseadas no tipo de arquivo
    const url = req.url;
    if (url.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|avif|ico)$/i)) {
      // Recursos estáticos: cache por 1 ano (imutáveis com hash no nome)
      const maxAge = 60 * 60 * 24 * 365; // 1 ano
      res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
    } else if (url.includes('/api/')) {
      // Dados de API: cache curto e validação
      res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
    } else {
      // Páginas HTML: no-cache para sempre ser fresco, mas permitir cache em CDN
      res.setHeader('Cache-Control', 'no-cache, public');
    }
  }
  
  // Cabeçalhos de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  next();
});

// Aplicar compressão gzip/deflate para melhorar performance
app.use(compression({
  // Comprimir tudo acima de 100 bytes (mais agressivo)
  threshold: 100,
  // Nível 9 para máxima compressão (prioriza tamanho sobre velocidade)
  level: 9,
  // Comprimir todos os tipos de conteúdo exceto imagens já comprimidas
  filter: (req, res) => {
    const path = req.path;
    
    // Não comprimir imagens que já estão comprimidas
    if (path.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
      return false;
    }
    
    // Comprimir de forma mais agressiva assets com hash no nome (JS/CSS)
    if (path.match(/\.(js|css|json|txt|html|xml)$/i)) {
      return true;
    }
    
    // Para outros tipos, usar o filtro padrão
    return compression.filter(req, res);
  },
  // Algoritmo preferencial Brotli para maior compressão, fallback para gzip
  // Esta opção só está disponível se o cliente suportar
  algorithm: 'brotli',
  
  // Comprimir todos os métodos HTTP, não apenas GET
  method: 'GET, POST, PUT, DELETE, OPTIONS',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
