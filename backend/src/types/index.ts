import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  is_verified: boolean;
  reputation_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role?: string;
  };
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  role?: string;
}

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      username: string;
    };
    token: string;
    refreshToken?: string;
  };
}
