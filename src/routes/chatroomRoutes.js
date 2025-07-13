import express from 'express';
import authMiddleware from "../middlewares/authMiddleware.js"
import { createChatroom, getChatroomListByUser, getMessageOfChatroom, sendMessageViaGemini } from '../controllers/chatroomController.js';


const router = express.Router();

router.post('/', authMiddleware, createChatroom )   // need to be authorized.

router.get('/', authMiddleware, getChatroomListByUser )   // need to be authorized.

router.get('/:id',authMiddleware, getMessageOfChatroom)

router.post('/:id/message', authMiddleware, sendMessageViaGemini)

export default router;