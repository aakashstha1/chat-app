import express from "express";

import {
  getFriendRequests,
  getFriends,
  getProfile,
  getUserById,
  respondFriendRequest,
  searchUsers,
  sendFriendRequest,
  updateProfile,
} from "../controllers/user.controller.js";

import upload from "../utils/multer.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and friend management
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aakash
 *               bio:
 *                 type: string
 *                 maxLength: 250
 *                 example: Full Stack Developer
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Unauthorized
 */
router.patch("/profile", verifyToken, upload.single("avatar"), updateProfile);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         example: aakash
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         example: 15
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/search", verifyToken, searchUsers);

/**
 * @swagger
 * /api/users/friends:
 *   get:
 *     summary: Get current user's friends
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Friends retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/friends", verifyToken, getFriends);

/**
 * @swagger
 * /api/users/friend-requests:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Friend requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/friend-requests", verifyToken, getFriendRequests);

/**
 * @swagger
 * /api/users/friend-request/{id}:
 *   post:
 *     summary: Send a friend request
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Friend request sent or automatically accepted
 *       400:
 *         description: Invalid request or already friends
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.post("/friend-request/:id", verifyToken, sendFriendRequest);

/**
 * @swagger
 * /api/users/friend-request/{id}/respond:
 *   post:
 *     summary: Accept or reject a friend request
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum:
 *                   - accept
 *                   - reject
 *                 example: accept
 *     responses:
 *       200:
 *         description: Friend request handled successfully
 *       400:
 *         description: Invalid action or request already handled
 *       404:
 *         description: Request not found
 *       401:
 *         description: Unauthorized
 */
router.post("/friend-request/:id/respond", verifyToken, respondFriendRequest);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/:id", verifyToken, getUserById);

export default router;
