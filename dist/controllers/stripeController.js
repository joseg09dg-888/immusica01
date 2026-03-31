"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSubscriptions = exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
// Crear intención de pago
const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        if (!amount)
            return res.status(400).json({ error: 'Monto requerido' });
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: { userId: req.user?.id.toString() || '' }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
exports.createPaymentIntent = createPaymentIntent;
// Obtener suscripciones del usuario (simplificado)
const getUserSubscriptions = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const subscriptions = await stripe.subscriptions.list({
            limit: 10,
            expand: ['data.plan', 'data.customer'],
        });
        const userSubscriptions = subscriptions.data.filter(sub => sub.metadata?.userId === req.user?.id.toString());
        // Mapear a un formato seguro (sin usar current_period_start/end)
        const simplified = userSubscriptions.map(sub => ({
            id: sub.id,
            status: sub.status,
            plan: sub.items.data[0]?.plan,
        }));
        res.json(simplified);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
exports.getUserSubscriptions = getUserSubscriptions;
