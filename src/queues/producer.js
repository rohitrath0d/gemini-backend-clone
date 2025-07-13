import { getChannel } from './rabbit.js';

const QUEUE_NAME = 'gemini_tasks';

export const sendToGeminiQueue = async (job) => {
  const channel = getChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
    persistent: true
  });

  console.log(`📤 Job sent to Gemini queue:`, job);
};
