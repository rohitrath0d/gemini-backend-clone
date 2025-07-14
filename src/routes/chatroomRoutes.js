import express from 'express';
import authMiddleware from "../middlewares/authMiddleware.js"
import { createChatroom, getChatroomListByUser, getMessageOfChatroom, sendMessageViaGemini } from '../controllers/chatroomController.js';
import { rateLimit } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createChatroom )   // need to be authorized.

router.get('/', authMiddleware, getChatroomListByUser )   

router.get('/:id',authMiddleware, getMessageOfChatroom)

router.post('/:id/message', authMiddleware, rateLimit, sendMessageViaGemini)             // Adding rate limit on message / prompting

export default router;