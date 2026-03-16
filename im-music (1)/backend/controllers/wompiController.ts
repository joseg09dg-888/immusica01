import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Wompi configuration
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || 'pub_test_Q5yS9s9s9s9s9s9s9s9s9s9s9s9s9s9s';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || 'prv_test_Q5yS9s9s9s9s9s9s9s9s9s9s9s9s9s9s';
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_secret_12345';

const generateIntegritySignature = (reference: string, amountInCents: number, currency: string) => {
  const chain = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(chain).digest('hex');
};

export const getPlans = (req: Request, res: Response) => {
  const plans = [
    { 
      id: 'basic', 
      name: 'PLAN BÁSICO — DISTRIBUCIÓN', 
      price: 19.99, 
      features: [
        'Distribución digital', 
        'Gestión de catálogo', 
        'Reportes básicos', 
        'Regalías estándar'
      ] 
    },
    { 
      id: 'pro', 
      name: 'PLAN PRO — CRECIMIENTO', 
      price: 149.99, 
      features: [
        'Todo lo anterior +', 
        'Investigación de mercado IA', 
        'Branding básico', 
        'Ads automáticos', 
        'Creativos IA', 
        'Reporting avanzado'
      ] 
    },
    { 
      id: 'premium', 
      name: 'PLAN PREMIUM ELITE — ARTIST DEVELOPMENT 360', 
      price: 2999.99, 
      features: [
        'Todo +', 
        'Investigación cultural profunda', 
        'Branding artístico completo', 
        'Marketing 360 personalizado', 
        'Optimización continua', 
        'Asistencia legal prioritaria', 
        'Financiamiento y estrategia', 
        'Reporting ejecutivo', 
        'Desarrollo artístico y management', 
        'Estrategias VTL'
      ] 
    }
  ];
  res.json(plans);
};

export const createPaymentSession = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'COP', planId } = req.body;
    const userId = req.user?.id;

    if (!amount || !userId) {
      return res.status(400).json({ error: 'Amount and User ID are required' });
    }

    const reference = `SUB-${userId}-${Date.now()}`;
    const amountInCents = Math.round(amount * 100);
    const signature = generateIntegritySignature(reference, amountInCents, currency);

    // Store pending subscription
    db.prepare(`
      INSERT INTO subscriptions (user_id, plan_name, status, reference, amount)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, planId, 'pending', reference, amount);

    res.json({
      publicKey: WOMPI_PUBLIC_KEY,
      currency,
      amountInCents,
      reference,
      signature,
      redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payment-status`
    });
  } catch (error: any) {
    console.error('Error creating Wompi session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const transaction = data.transaction;

    if (transaction.status === 'APPROVED') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      db.prepare(`
        UPDATE subscriptions 
        SET status = 'active', expires_at = ?
        WHERE reference = ?
      `).run(expiresAt.toISOString(), transaction.reference);

      // Update artist tier if applicable
      const sub = db.prepare('SELECT user_id, plan_name FROM subscriptions WHERE reference = ?').get(transaction.reference) as any;
      if (sub) {
        db.prepare('UPDATE artists SET tier = ? WHERE user_id = ?').run(sub.plan_name, sub.user_id);
      }
    } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED' || transaction.status === 'ERROR') {
      db.prepare(`
        UPDATE subscriptions 
        SET status = 'failed'
        WHERE reference = ?
      `).run(transaction.reference);
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error handling Wompi webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTransactionStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sub = db.prepare('SELECT * FROM subscriptions WHERE reference = ? OR id = ?').get(id, id);
    res.json(sub || { error: 'Transaction not found' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSubscriptionsByEmail = async (req: Request, res: Response) => {
  const { email } = req.query;
  try {
    const subs = db.prepare(`
      SELECT s.* FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE u.email = ?
    `).all(email);
    res.json(subs);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching subscriptions' });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const history = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching history' });
  }
};
