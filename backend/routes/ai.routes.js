import express from "express";

import { verifyToken } from "../middlewares/verifyToken.js";
import { aiRateLimiter } from "../middlewares/aiRateLimiter.js";
import { getAssistant, chatWithAI } from "../controllers/ai.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Built-in AI Assistant
 */

/**
 * @swagger
 * /api/ai:
 *   get:
 *     summary: Get the shared AI assistant and this user's own AI conversation id
 *     tags: [AI]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Assistant info retrieved successfully
 *       401:
 *         description: Unauthorized
 *       503:
 *         description: AI assistant is not available
 */
router.get("/", verifyToken, getAssistant);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to the AI assistant
 *     tags: [AI]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Explain JWT authentication
 *     responses:
 *       201:
 *         description: AI responded successfully
 *       400:
 *         description: Empty or invalid message
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: AI provider unavailable
 */
router.post("/chat", verifyToken, aiRateLimiter, chatWithAI);

export default router;
