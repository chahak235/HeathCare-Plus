import { Request, Response } from 'express';
import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'healthcare-backend',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Middleware to expose the metrics
export function apiMetrics(req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  register.metrics().then((metrics) => {
    res.end(metrics);
  }).catch((err) => {
    res.status(500).end(err.message);
  });
}
