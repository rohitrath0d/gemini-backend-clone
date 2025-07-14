import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.post('/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  console.log("!!!WEBHOOK HIT BY STRIPE!!!");
  res.sendStatus(200);
});

app.use(express.json());

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
