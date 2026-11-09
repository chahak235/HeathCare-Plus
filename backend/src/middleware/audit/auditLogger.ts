import { Request, Response, NextFunction } from 'express';

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // Safely access user if it exists
  const userId = (req as any).user?.id || 'anonymous';
  
  console.log(`[AUDIT] method=${req.method} url=${req.originalUrl} user=${userId}`);
  
  // Store original end to capture response
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end method to log response
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - startTime;
    console.log(`[AUDIT] completed method=${req.method} url=${req.originalUrl} status=${res.statusCode} duration=${duration}ms user=${userId}`);
    
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
