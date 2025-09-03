import express, { Express, Request, Response, NextFunction } from 'express';

export function initServer(): Express {
  const port = Number(process.env.LOCAL_PORT) || 3000;
  const app = express();

  app.use(express.json());

  const allowedOrigins = ['http://localhost:5000', 'http://localhost:5173'];

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      // Preflight-запрос — сразу ответить 200
      return res.sendStatus(200);
    }

    next();
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  return app;
}