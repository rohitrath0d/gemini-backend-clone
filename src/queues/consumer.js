import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { askGemini } from '../lib/gemini.js';  


const prisma = new PrismaClient();

// const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'gemini_tasks';

// Mocked Gemini function — replace later with real API call
const fetchGeminiResponse = async (content) => {
  return `Gemini mock response for: "${content.slice(0, 30)}..."`;
};

const startConsumer = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`[Consumer] Waiting for messages in '${QUEUE_NAME}'`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const job = JSON.parse(msg.content.toString());
        const { messageId, content, chatroomId } = job;

        console.log(`Received message for Gemini:`, job);

        // // 1. Get Gemini response (mock for now)
        // const geminiReply = await fetchGeminiResponse(content);

        const geminiReply = await askGemini(content);

        // 2. Update message in DB
        await prisma.message.update({
          where: { id: messageId },
          data: { response: geminiReply }
        });

        console.log(`Updated message with Gemini response.`);

        // 3. Acknowledge the message
        channel.ack(msg);
      }
    }, { noAck: false });

  } catch (error) {
    console.error("Error in consumer:", error);
  }
};

startConsumer();