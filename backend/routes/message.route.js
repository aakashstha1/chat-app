import express from "express";

import { getMessages, sendMessage } from "../controllers/message.controller.js";

import { verifyToken } from "../middleware/verifyToken.js";
import upload from "../utils/multer.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Private messaging between friends
 */

/**
 * @swagger
 * /api/messages/{friendId}:
 *   get:
 *     summary: Get messages with a friend
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *         example: 30
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: You are not friends with this user
 *       401:
 *         description: Unauthorized
 */
router.get("/:friendId", verifyToken, getMessages);

/**
 * @swagger
 * /api/messages/{friendId}:
 *   post:
 *     summary: Send a message to a friend
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: Hello, how are you?
 *               files:
 *                 type: array
 *                 maxItems: 6
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Message cannot be empty
 *       403:
 *         description: You are not friends with this user
 *       401:
 *         description: Unauthorized
 */
router.post("/:friendId", verifyToken, upload.array("files", 6), sendMessage);

export default router;
