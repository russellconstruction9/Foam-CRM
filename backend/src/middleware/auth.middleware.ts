import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { dbService } from '../services/database.service';
import { AuthenticatedRequest, User, Organization, OrganizationMember } from '../types';
// import { logger } from '../utils/logger';

const authService = new AuthService();

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = authService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
      return;
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Get user details
    const userResult = await dbService.query(
      'SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Get organization details
    const orgResult = await dbService.query(
      'SELECT id, name, slug, logo_url, subscription_plan, subscription_status, settings, created_at, updated_at FROM organizations WHERE id = $1',
      [payload.organizationId]
    );

    if (orgResult.rows.length === 0) {
      res.status(401).json({ 
        success: false, 
        message: 'Organization not found' 
      });
      return;
    }

    // Get membership details
    const memberResult = await dbService.query(
      'SELECT id, user_id, organization_id, role, permissions, joined_at FROM organization_members WHERE user_id = $1 AND organization_id = $2',
      [payload.userId, payload.organizationId]
    );

    if (memberResult.rows.length === 0) {
      res.status(401).json({ 
        success: false, 
        message: 'Organization membership not found' 
      });
      return;
    }

    // Attach user, organization, and member data to request
    const authReq = req as AuthenticatedRequest;
    authReq.user = userResult.rows[0] as User;
    authReq.organization = orgResult.rows[0] as Organization;
    authReq.member = memberResult.rows[0] as OrganizationMember;
    authReq.permissions = payload.permissions;

    next();
  } catch (error) {
    // logger.error('Authentication middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.member || !roles.includes(authReq.member.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.permissions || (!authReq.permissions.includes(permission) && !authReq.permissions.includes('*'))) {
      res.status(403).json({ 
        success: false, 
        message: 'Permission denied' 
      });
      return;
    }

    next();
  };
};