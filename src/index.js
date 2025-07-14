import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';


import authRoutes from  './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatroomRoutes from './routes/chatroomRoutes.js'
import stripeSubscriptionRoutes from './routes/stripeSubscriptionRoutes.js';

import { connectRabbit } from './queues/rabbit.js';
import { handleStripeWebhook } from './controllers/stripeSubcscriptionController.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

await connectRabbit();

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/chatroom', chatroomRoutes)
app.use('/api/subscription', stripeSubscriptionRoutes)


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));