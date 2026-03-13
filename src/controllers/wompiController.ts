import { Request, Response } from 'express';
import db from '../database';

const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

// Definición de los planes con sus límites de artistas
const plans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 15,
    priceInCents: 1500,
    currency: 'USD',
    maxArtists: 1,
    description: 'Todo lo esencial para lanzar tu música',
    features: [
      'Sube canciones ilimitadas',
      'Sube letras ilimitadas',
      'Crea divisiones de regalías (splits)',
      'Estadísticas de streaming diarias',
      'Nombre de discográfica personalizable',
      '1 TB para compartir archivos'
    ]
  },
  {
    id: 'pro',
    name: 'Músico Plus',
    price: 3.75,
    priceInCents: 375,
    currency: 'USD',
    maxArtists: 2,
    description: 'Para artistas que buscan más control',
    features: [
      'Todo lo del plan Básico',
      'Fecha de lanzamiento personalizable',
      'Precios personalizables en iTunes',
      'Estadísticas y análisis avanzados',
      'Reemplaza el audio de tus canciones',
      'Información de contacto de playlists'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 7.5,
    priceInCents: 750,
    currency: 'USD',
    maxArtists: 5,
    description: 'Gestión profesional completa',
    features: [
      'Todo lo del plan Pro',
      'Múltiples artistas bajo una cuenta',
      'Monitorea tu música en Spotify y Apple Music',
      'Soporte prioritario',
      'Herramientas promocionales avanzadas'
    ]
  },
  {
    id: 'enterprise_10',
    name: 'Enterprise 10',
    price: 19.99,
    priceInCents: 1999,
    currency: 'USD',
    maxArtists: 10,
    description: 'Para sellos pequeños',
    features: [
      'Todo lo del plan Premium',
      'Hasta 10 artistas',
      'Reportes consolidados',
      'API de acceso'
    ]
  }
  // Puedes agregar más planes (enterprise_20, etc.)
];

// Mapa de límites para uso rápido
const planLimits: { [key: string]: number } = {};
plans.forEach(p => { planLimits[p.id] = p.maxArtists; });

// Almacenamiento en memoria para pagos pendientes (en producción usar BD)
(global as any).pendingPayments = (global as any).pendingPayments || [];

export const getPlans = (req: Request, res: Response) => {
  res.json(plans);
};

export const createPayment = async (req: Request, res: Response) => {
  const { planId, email = 'cliente@ejemplo.com' } = req.body;
  try {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });

    const reference = `SUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const checkoutUrl = new URL('https://checkout.wompi.co/p/');
    checkoutUrl.searchParams.append('public-key', WOMPI_PUBLIC_KEY);
    checkoutUrl.searchParams.append('amount-in-cents', plan.priceInCents.toString());
    checkoutUrl.searchParams.append('currency', plan.currency);
    checkoutUrl.searchParams.append('reference', reference);
    checkoutUrl.searchParams.append('redirect-url', `${process.env.FRONTEND_URL}/suscripcion-exitosa?reference=${reference}`);

    // Guardar pago pendiente
    (global as any).pendingPayments.push({
      reference,
      planId,
      userEmail: email,
      status: 'PENDING',
      createdAt: new Date()
    });

    res.json({ paymentUrl: checkoutUrl.toString(), reference, plan: plan.name });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const wompiWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('Evento recibido:', event);

    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction;
      const { reference, status, id: transactionId } = transaction;

      const pendingPayments = (global as any).pendingPayments || [];
      const pendingPayment = pendingPayments.find((p: any) => p.reference === reference);

      if (pendingPayment) {
        pendingPayment.status = status;

        if (status === 'APPROVED') {
          // Obtener el límite de artistas según el plan
          const maxArtists = planLimits[pendingPayment.planId] || 1;

          // Guardar suscripción en la base de datos con max_artists
          const stmt = db.prepare(`
            INSERT INTO subscriptions (user_email, plan_id, start_date, status, transaction_id, max_artists)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            pendingPayment.userEmail,
            pendingPayment.planId,
            new Date().toISOString(),
            'ACTIVE',
            transactionId,
            maxArtists
          );
          console.log(`✅ Suscripción activada para ${pendingPayment.userEmail} con límite de ${maxArtists} artistas`);
        }
      }
    }
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error en webhook:', error);
    res.status(500).send('Error');
  }
};

export const checkTransactionStatus = async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  try {
    const response = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserSubscriptions = (req: Request, res: Response) => {
  const userEmail = req.query.email as string;
  if (!userEmail) return res.status(400).json({ error: 'Email requerido' });

  const stmt = db.prepare('SELECT * FROM subscriptions WHERE user_email = ? AND status = "ACTIVE"');
  const subscriptions = stmt.all(userEmail);
  res.json(subscriptions);
};