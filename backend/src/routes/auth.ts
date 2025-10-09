import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../utils/database-sqlite';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { sendValidationError, sendUnauthorizedError, sendServerError, sendConflictError } from '../utils/errorHandler';

const router = express.Router();

// Register new user (admin only)
router.post('/register', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create new users' });
    }

    const { email, password, first_name, last_name, role = 'read_only', phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return sendValidationError(res, 'Missing required fields', { 
        required: ['email', 'password', 'first_name', 'last_name'] 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendValidationError(res, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      return sendValidationError(res, 'Password must be at least 8 characters long');
    }

    // Check if user already exists
    const db = getDatabase();
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await db.run(
      'INSERT INTO users (email, password_hash, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, role, phone]
    );

    const userId = result.lastID;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        first_name,
        last_name,
        role,
        phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const db = getDatabase();
    const user = await db.get(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const userId = req.user!.id;

    const db = getDatabase();
    await db.run(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
      [first_name, last_name, phone, userId]
    );

    // Get updated user data
    const user = await db.get(
      'SELECT id, email, first_name, last_name, role, phone FROM users WHERE id = ?',
      [userId]
    );

    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get current password hash
    const db = getDatabase();
    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;