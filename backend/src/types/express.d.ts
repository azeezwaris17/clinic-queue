// src/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

export {};