import { User } from '../types/auth.types';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      id?: string;
    }
  }
}

// If you don't have auth.types.ts yet, create a basic one
