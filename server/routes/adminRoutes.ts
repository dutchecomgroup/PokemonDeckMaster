import express from 'express';
import {
  isAdmin,
  getStatistics,
  getAllUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAllCollections,
  deleteCollection,
  getSettings,
  updateSettings,
  getRecentUsers,
  getPopularCards,
  getCards,
  getSets
} from '../controllers/adminController';

const router = express.Router();

// Statistics routes
router.get('/statistics', isAdmin, getStatistics);

// User routes
router.get('/users', isAdmin, getAllUsers);
router.get('/recent-users', isAdmin, getRecentUsers);
router.put('/users/:id', isAdmin, updateUser);
router.patch('/users/:id/role', isAdmin, updateUserRole);
router.patch('/users/:id/status', isAdmin, updateUserStatus);
router.delete('/users/:id', isAdmin, deleteUser);

// Collection routes
router.get('/collections', isAdmin, getAllCollections);
router.delete('/collections/:id', isAdmin, deleteCollection);

// Card routes
router.get('/cards', isAdmin, getCards);
router.get('/sets', isAdmin, getSets);
router.get('/popular-cards', isAdmin, getPopularCards);

// Settings routes
router.get('/settings', isAdmin, getSettings);
router.put('/settings', isAdmin, updateSettings);

export default router;