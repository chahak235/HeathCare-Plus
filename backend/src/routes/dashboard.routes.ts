import { Router, Request, Response } from 'express';

const router = Router();

// Example dashboard endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Dashboard endpoint is working.'
  });
});

export default router;
