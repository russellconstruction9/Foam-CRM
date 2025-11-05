import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { dbService } from '../services/database.service';
// import { logger } from '../utils/logger';
import { User, Organization, OrganizationMember, ApiResponse } from '../types';

const authService = new AuthService();

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name, organizationName } = req.body;

      // Validate input
      if (!email || !password || !name || !organizationName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, name, and organization name are required'
        });
        return;
      }

      // Validate email format
      if (!authService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = authService.validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
        return;
      }

      // Check if user already exists
      const existingUser = await dbService.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Get existing organization slugs to avoid conflicts
      const existingSlugs = await dbService.query(
        'SELECT slug FROM organizations'
      );
      const slugs = existingSlugs.rows.map(row => row.slug);

      // Generate unique slug
      const orgSlug = authService.generateUniqueSlug(organizationName, slugs);

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user and organization in transaction
      const client = await dbService.getClient();
      await client.query('BEGIN');

      try {
        // Create user
        const userResult = await client.query(
          'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url, email_verified, created_at, updated_at',
          [email.toLowerCase(), passwordHash, name]
        );
        const user: User = userResult.rows[0];

        // Create organization
        const orgResult = await client.query(
          'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug, logo_url, subscription_plan, subscription_status, settings, created_at, updated_at',
          [organizationName, orgSlug]
        );
        const organization: Organization = orgResult.rows[0];

        // Add user as organization owner
        const memberResult = await client.query(
          'INSERT INTO organization_members (user_id, organization_id, role, permissions) VALUES ($1, $2, $3, $4) RETURNING id, user_id, organization_id, role, permissions, joined_at',
          [user.id, organization.id, 'owner', JSON.stringify(['*'])]
        );
        const member: OrganizationMember = memberResult.rows[0];

        // Create tenant schema
        await client.query('SELECT create_tenant_schema($1)', [organization.id]);

        await client.query('COMMIT');

        // Generate JWT tokens
        const tokenPayload = {
          userId: user.id,
          organizationId: organization.id,
          role: member.role,
          permissions: member.permissions
        };

        const token = authService.generateToken(tokenPayload);
        const refreshToken = authService.generateRefreshToken(tokenPayload);

        // logger.info(`New user registered: ${user.email} for organization: ${organization.name}`);

        const response: ApiResponse = {
          success: true,
          data: {
            user,
            organization,
            member,
            token,
            refreshToken
          },
          message: 'Registration successful'
        };

        res.status(201).json(response);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      // logger.error('Registration error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Get user with organization membership
      const result = await dbService.query(`
        SELECT 
          u.id, u.email, u.name, u.password_hash, u.avatar_url, u.email_verified, u.created_at, u.updated_at,
          o.id as org_id, o.name as org_name, o.slug as org_slug, o.logo_url, o.subscription_plan, o.subscription_status, o.settings,
          om.id as member_id, om.role, om.permissions, om.joined_at
        FROM users u
        JOIN organization_members om ON u.id = om.user_id
        JOIN organizations o ON om.organization_id = o.id
        WHERE u.email = $1
        LIMIT 1
      `, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      const userData = result.rows[0];

      // Verify password
      const isValidPassword = await authService.verifyPassword(password, userData.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Prepare response data
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        email_verified: userData.email_verified,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      const organization: Organization = {
        id: userData.org_id,
        name: userData.org_name,
        slug: userData.org_slug,
        logo_url: userData.logo_url,
        subscription_plan: userData.subscription_plan,
        subscription_status: userData.subscription_status,
        settings: userData.settings,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      const member: OrganizationMember = {
        id: userData.member_id,
        user_id: userData.id,
        organization_id: userData.org_id,
        role: userData.role,
        permissions: userData.permissions || [],
        joined_at: userData.joined_at
      };

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.id,
        organizationId: organization.id,
        role: member.role,
        permissions: member.permissions
      };

      const token = authService.generateToken(tokenPayload);
      const refreshToken = authService.generateRefreshToken(tokenPayload);

      // logger.info(`User logged in: ${user.email}`);

      const response: ApiResponse = {
        success: true,
        data: {
          user,
          organization,
          member,
          token,
          refreshToken
        },
        message: 'Login successful'
      };

      res.json(response);

    } catch (error) {
      // logger.error('Login error:', error);
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      // Verify refresh token
      const payload = authService.verifyToken(refreshToken);

      // Generate new access token
      const newTokenPayload = {
        userId: payload.userId,
        organizationId: payload.organizationId,
        role: payload.role,
        permissions: payload.permissions
      };

      const newToken = authService.generateToken(newTokenPayload);

      const response: ApiResponse = {
        success: true,
        data: {
          token: newToken
        },
        message: 'Token refreshed successfully'
      };

      res.json(response);

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    // For JWT, logout is handled client-side by removing the token
    // In the future, we could implement token blacklisting here
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    // This endpoint requires authentication middleware
    const authReq = req as any; // Will be properly typed after auth middleware
    
    const response: ApiResponse = {
      success: true,
      data: {
        user: authReq.user,
        organization: authReq.organization,
        member: authReq.member,
        permissions: authReq.permissions
      }
    };

    res.json(response);
  };
}