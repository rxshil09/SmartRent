import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { UsersService } from './users.service.js';

export const usersRouter = Router();

// GET /users — list all users (admin)
// Supports: ?role=customer|admin, ?search=, ?page=, ?limit=
usersRouter.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { role, search, page, limit } = req.query;
    const result = await UsersService.list({ role, search, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /users/stats — user count stats (admin dashboard)
usersRouter.get('/stats', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const stats = await UsersService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /users/:id — get a single user by ID (admin)
usersRouter.get('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const user = await UsersService.getById(req.params.id);
    res.json({ user });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
});

// PATCH /users/:id/role — change a user's role (admin)
usersRouter.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await UsersService.updateRole(req.params.id, role);
    res.json({ user });
  } catch (error) {
    const status = error.message === 'User not found' ? 404
      : error.message.startsWith('Invalid role') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
});

// PATCH /users/:id/profile — update name (self or admin)
usersRouter.patch('/:id/profile', requireAuth, async (req, res) => {
  try {
    // Only allow self-update or admin
    if (req.userId !== req.params.id && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const user = await UsersService.updateProfile(req.params.id, req.body);
    res.json({ user });
  } catch (error) {
    const status = error.message === 'User not found' ? 404
      : error.message.includes('empty') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
});

// DELETE /users/:id — remove a customer user (admin)
usersRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await UsersService.delete(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    const status = error.message === 'User not found' ? 404
      : error.message.startsWith('Cannot') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
});

// PATCH /users/:id/address — update default address (self or admin)
usersRouter.patch('/:id/address', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.id && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const user = await UsersService.updateAddress(req.params.id, req.body);
    res.json({ user });
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
});