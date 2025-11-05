import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '../types';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
    return jwt.sign(
      JSON.parse(JSON.stringify(payload)), 
      this.jwtSecret, 
      {
        expiresIn: this.jwtExpiresIn,
      } as jwt.SignOptions
    );
  }

  generateRefreshToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
    return jwt.sign(
      JSON.parse(JSON.stringify(payload)), 
      this.jwtSecret, 
      {
        expiresIn: this.jwtRefreshExpiresIn,
      } as jwt.SignOptions
    );
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  generateUniqueSlug(baseName: string, existingSlugs: string[]): string {
    let slug = this.generateSlug(baseName);
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${this.generateSlug(baseName)}-${counter}`;
      counter++;
    }

    return slug;
  }

  generateRandomPin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}