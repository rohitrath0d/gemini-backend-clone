import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();




export const handleStripeWebhook = async (req, res) => {

  console.log("!!!WEBHOOK HIT BY STRIPE!!!");

  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,                                       // raw body (not JSON-parsed!)
      signature,                                           // Stripe signature header
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log("Stripe webhook event parsed:", event.type);

  } catch (error) {
    console.error("Webhook verification failed: ", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  console.log(event);


  // if Event verified and parsed, handling it here.
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log("Full session object:", session);

      // can use session.customer_email or metadata to find the user

      // const userEmail = session.customer_email;
      // const userId = event.data.object.client_reference_id;
      const userId = session.client_reference_id;
      console.log("client_reference_id from Stripe:", userId);


      // find the user in DB and mark them as pro
      await prisma.user.update({
        where: {
          // email: userEmail,
          id: userId                             // can't use both email and id in where: for Prisma’s findUnique or update. hence only use one unique field ✅
          // client_reference_id: userId
        },
        data: {
          subscriptionTier: 'pro'
        }

        // // hardcoded details checking
        // await prisma.user.update({
        //   where: { 
        //     id: "e2841b0d-4d46-4583-b27d-75ebba7ffe5b" 
        //     // client_reference_id: userId
        //   },
        //   data: { 
        //     subscriptionTier: 'pro' 
        //   },

      });
      console.log(`User ${userId} upgraded to Pro`);

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  console.log("Received Stripe event:", event.type);

  // Tell stripe we handled it.
  res.status(200).json({
    received: true
  });

};



export const createProCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(userId);
    

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      // customer_email: user.email, // optional
      // client_reference_id: user.id, //  link user to Stripe session            // shows error because, userId is already grabbing id, and hence accessing it through user, was null/undefined.
      client_reference_id: userId,                  
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Plan Subscription',
              description: 'Upgrade to Pro tier features',
            },
            unit_amount: 9900, // in cents = $99.00
          },
          quantity: 1,
        },
      ],
      // success_url: `${process.env.CLIENT_URL}/success`,
      // cancel_url: `${process.env.CLIENT_URL}/cancel`,

      // stripe's built in success/cancel url
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });

    return res.status(200).json({
      success: true,
      sessionUrl: session.url,
    });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
};


export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      subscriptionTier: user.subscriptionTier || 'basic', // fallback if null
    });

  } catch (error) {
    console.error(" Subscription status error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch subscription status",
    });
  }
};
