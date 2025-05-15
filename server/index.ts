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

// Aplicar compressão gzip/brotli para melhorar performance
app.use(compression({
  // Comprimir tudo acima de 1 byte (máxima agressividade)
  threshold: 1,
  // Nível 11 para máxima compressão Brotli (valores válidos 0-11)
  // ou nível 9 para Gzip/Deflate (valores válidos 0-9)
  level: 11,
  // Comprimir todos os tipos de conteúdo exceto imagens já comprimidas
  filter: (req, res) => {
    const path = req.path;
    const userAgent = req.headers['user-agent'] || '';
    
    // Não comprimir imagens que já estão comprimidas
    if (path.match(/\.(jpg|jpeg|png|gif|webp|avif|ico)$/i)) {
      return false;
    }
    
    // Comprimir SVG - eles são texto XML e comprimem bem
    if (path.endsWith('.svg')) {
      return true;
    }
    
    // Comprimir arquivos de fontes que não são woff2 (woff2 já é comprimido)
    if (path.match(/\.(woff|ttf|eot)$/i)) {
      return true;
    }
    
    // Comprimir de forma mais agressiva assets de texto (JS/CSS/HTML/JSON)
    if (path.match(/\.(js|css|json|txt|html|xml)$/i)) {
      return true;
    }
    
    // Para outros tipos, usar o filtro padrão
    return compression.filter(req, res);
  },
  // Brotli é superior a gzip - usamos isso como algoritmo principal
  // "brotli" agora é suportado diretamente pelo pacote compression
  algorithm: 'brotli',
  
  // Configurações avançadas do Brotli via zlib
  // Estas configurações são aplicadas através do middleware
  // Nota: O tipo 'any' é usado porque o TypeScript pode não reconhecer estas opções
  params: {
    // Usar configurações otimizadas para melhor compressão
    // sem preocupação com CPU (compressão no servidor é feita uma vez só)
    zlib: {
      level: 9, // Nível máximo de compressão (zlib)
      windowBits: 15, // Tamanho máximo da janela
      memLevel: 9, // Memória máxima
      strategy: 3, // Z_HUFFMAN_ONLY - melhor para textos
    }
  },
  
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
