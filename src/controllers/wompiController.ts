import { Request, Response } from 'express';

// Configuración de Wompi (desde .env)
const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || '';

// Planes de suscripción MEJORADOS (con todas las funcionalidades de DistroKid)
const plans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 15,
    priceInCents: 1500,
    currency: 'USD',
    description: 'Todo lo que ofrece DistroKid en su plan básico + herramientas IA',
    features: [
      'Sube canciones ilimitadas',
      'Sube letras ilimitadas',
      'Etiqueta de artista verificado en Spotify',
      'Crea divisiones de regalías (splits)',
      'Acceso a herramientas promocionales gratuitas',
      'Acceso a app móvil',
      'Letras sincronizadas en Apple Music',
      'Estadísticas de streaming diarias',
      'Nombre de discográfica personalizable',
      'Fecha de lanzamiento personalizable',
      'Precios personalizables en iTunes',
      'Monitorea tu música en Spotify y Apple Music',
      '1 TB para compartir archivos al instante',
      'Estadísticas y análisis básicos',
      '➕ Distribución digital',
      '➕ Gestión de catálogo',
      '➕ Reportes básicos',
      '➕ Regalías estándar'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    priceInCents: 9900,
    currency: 'USD',
    description: 'Todo lo de DistroKid Plus + IA y marketing avanzado',
    features: [
      'Todo lo del plan Básico',
      'Estadísticas y análisis avanzados',
      'Reemplaza el audio de tus canciones',
      'Información de contacto de muchas playlists',
      '➕ Investigación de mercado IA',
      '➕ Branding básico',
      '➕ Ads automáticos',
      '➕ Creativos IA',
      '➕ Reporting avanzado'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Elite',
    price: 2500, // Precio promedio (se mostrará como "Desde $2,000 USD")
    priceInCents: 250000,
    currency: 'USD',
    description: 'Servicio 360 personalizado (no automatizado)',
    features: [
      'Todo lo del plan Pro',
      '➕ Investigación cultural profunda',
      '➕ Branding artístico completo',
      '➕ Marketing 360 personalizado',
      '➕ Equipo humano dedicado: filmmaker, director de contenido, estratega de ads, project manager',
      '➕ Asistencia legal prioritaria',
      '➕ Financiamiento y estrategia',
      '➕ Reporting ejecutivo',
      '➕ Desarrollo artístico y management',
      '➕ Estrategias en eventos tradicionales'
    ],
    isContactRequired: true // Indica que requiere contacto por WhatsApp
  }
];

// Almacenamiento en memoria (para pruebas)
(global as any).pendingPayments = (global as any).pendingPayments || [];
(global as any).subscriptions = (global as any).subscriptions || [];

// Obtener planes
export const getPlans = (req: Request, res: Response) => {
  res.json(plans);
};

// Crear pago (genera URL de Wompi)
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
    checkoutUrl.searchParams.append('redirect-url', `${process.env.FRONTEND_URL}/suscripcion-exitosa`);

    (global as any).pendingPayments.push({
      reference,
      planId,
      userEmail: email,
      status: 'PENDING',
      createdAt: new Date()
    });

    res.json({
      paymentUrl: checkoutUrl.toString(),
      reference,
      plan: plan.name
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook para recibir notificaciones de Wompi
export const wompiWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('Evento recibido:', event);

    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction;
      const { reference, status, id: transactionId } = transaction;

      const pendingPayment = (global as any).pendingPayments.find((p: any) => p.reference === reference);
      if (pendingPayment) {
        pendingPayment.status = status;
        if (status === 'APPROVED') {
          (global as any).subscriptions.push({
            userEmail: pendingPayment.userEmail,
            planId: pendingPayment.planId,
            startDate: new Date(),
            status: 'ACTIVE',
            transactionId
          });
          console.log(`✅ Suscripción activada para ${pendingPayment.userEmail}`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error en webhook:', error);
    res.status(500).send('Error');
  }
};

// Consultar estado de transacción
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

// Obtener suscripciones de un usuario
export const getUserSubscriptions = (req: Request, res: Response) => {
  const userEmail = req.query.email as string || 'cliente@ejemplo.com';
  const userSubs = (global as any).subscriptions.filter((s: any) => s.userEmail === userEmail && s.status === 'ACTIVE');
  res.json(userSubs);
};