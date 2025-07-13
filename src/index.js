import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';


import authRoutes from  './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatroomRoutes from './routes/chatroomRoutes.js'

import { connectRabbit } from './queues/rabbit.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


await connectRabbit();

app.use('/auth', authRoutes)
app.use('/user', userRoutes)
app.use('/chatroom', chatroomRoutes)


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));