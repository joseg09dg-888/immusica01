import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Crear intención de pago
export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    if (!amount) return res.status(400).json({ error: 'Monto requerido' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { userId: req.user?.id.toString() || '' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener suscripciones del usuario (simplificado)
export const getUserSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      expand: ['data.plan', 'data.customer'],
    });

    const userSubscriptions = subscriptions.data.filter(sub =>
      sub.metadata?.userId === req.user?.id.toString()
    );

    // Mapear a un formato seguro (sin usar current_period_start/end)
    const simplified = userSubscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      plan: sub.items.data[0]?.plan,
    }));

    res.json(simplified);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};