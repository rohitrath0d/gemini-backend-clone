import express from 'express';
import { createProCheckoutSession, getSubscriptionStatus, handleStripeWebhook } from '../controllers/stripeSubcscriptionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/pro', authMiddleware, createProCheckoutSession);

// No auth here — it's called by Stripe
// router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);        // Webhooks Must Be Handled Outside Routers (Direct Mount) Stripe sends raw POST requests to a fixed URL (/webhook/stripe), and it expects: 1. A raw (not JSON-parsed) body  2. A direct response (no authentication, no middlewares)

router.get('/status', authMiddleware, getSubscriptionStatus)

export default router;
