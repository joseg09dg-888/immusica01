import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

const users: any[] = [];
const subscriptions: any[] = [];

const plans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 15,
    description: 'Distribución digital, gestión de catálogo, reportes básicos, regalías estándar',
    features: ['Distribución digital', 'Gestión de catálogo', 'Reportes básicos', 'Regalías estándar']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'Todo lo básico + Investigación de mercado IA, Branding básico, Ads automáticos, Creativos IA, Reporting avanzado',
    features: ['Investigación de mercado IA', 'Branding básico', 'Ads automáticos', 'Creativos IA', 'Reporting avanzado']
  },
  {
    id: 'premium',
    name: 'Premium Elite',
    price: 2000,
    description: 'Todo + Investigación cultural profunda, Branding artístico completo, Marketing 360 personalizado, Asistencia legal prioritaria, financiamiento y estrategia',
    features: ['Investigación cultural profunda', 'Branding artístico completo', 'Marketing 360 personalizado', 'Asistencia legal prioritaria', 'financiamiento y estrategia']
  }
];

export const getPlans = (req: Request, res: Response) => {
  res.json(plans);
};

export const createSubscription = async (req: Request, res: Response) => {
  const { planId, paymentMethodId } = req.body;
  const userEmail = 'cliente@ejemplo.com'; // Luego lo sacarás del token

  try {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });

    let customer;
    const existingUser = users.find(u => u.email === userEmail);
    if (existingUser && existingUser.stripeCustomerId) {
      customer = await stripe.customers.retrieve(existingUser.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      users.push({ email: userEmail, stripeCustomerId: customer.id });
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    subscriptions.push({
      id: subscription.id,
      userId: userEmail,
      planId: plan.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      console.log('Pago exitoso', event.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Suscripción cancelada', event.data.object);
      break;
    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
};