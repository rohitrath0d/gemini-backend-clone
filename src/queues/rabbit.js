import amqp from 'amqplib';

let connection, channel;

// const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RABBITMQ_URL = process.env.RABBITMQ_URL;

export const connectRabbit = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('✅ RabbitMQ connected');
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error);
    process.exit(1);
  }
};

export const getChannel = () => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
};
