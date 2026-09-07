import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getOne, run, query } from '../config/database.js';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['ANALYST', 'ADMIN']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration parameters',
        errors: parseResult.error.errors,
      });
    }

    const { username, email, password, fullName, role } = parseResult.data;

    // Check existing email/username
    const existing = await getOne<User>(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email or username already exists.',
        errorCode: 'USER_ALREADY_EXISTS',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `USR-${Date.now()}`;
    const userRole = role || 'ANALYST';

    await run(
      `INSERT INTO users (id, username, email, password_hash, role, full_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, email, hashedPassword, userRole, fullName]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, username, email, role: userRole },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    // Log registration
    await run(
      'INSERT INTO activity_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [`LOG-${Date.now()}`, userId, 'USER_REGISTER', `User ${username} registered with role ${userRole}`, req.ip || '127.0.0.1']
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          fullName,
          role: userRole,
        },
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration.',
      errorCode: 'REGISTRATION_FAILED',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login credentials format',
      });
    }

    const { email, password } = parseResult.data;

    const user = await getOne<User>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    await run(
      'INSERT INTO activity_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [`LOG-${Date.now()}`, user.id, 'USER_LOGIN', `User ${user.username} logged in`, req.ip || '127.0.0.1']
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to process login request.',
      errorCode: 'LOGIN_FAILED',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const user = await getOne<User>('SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?', [
    req.user.id,
  ]);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
      },
    },
  });
};
