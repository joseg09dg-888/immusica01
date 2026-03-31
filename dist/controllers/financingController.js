"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.solicitarConsultoria = exports.obtenerMiElegibilidad = exports.evaluarElegibilidad = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const RoyaltyModel = __importStar(require("../models/Royalty"));
const TrackModel = __importStar(require("../models/Track"));
const FinancingModel = __importStar(require("../models/FinancingEligibility"));
// ============================================
// EVALUAR ELEGIBILIDAD DEL ARTISTA
// ============================================
const evaluarElegibilidad = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista asociado' });
        const artist = artists[0];
        // 1. Obtener datos históricos de regalías (últimos 12 meses)
        const royaltiesSummary = RoyaltyModel.getSummary(artist.id);
        const ingresosAnuales = royaltiesSummary.total; // Esto ya es el total en dólares
        // 2. Obtener número de canciones publicadas
        const tracks = TrackModel.getTracksByArtist(artist.id);
        const cancionesPublicadas = tracks.length;
        // 3. Determinar si es propietario de masters (regla simple: si tiene más de 5 canciones)
        const esPropietarioMasters = cancionesPublicadas > 5;
        // 4. Lógica de puntuación (ajusta según los criterios reales)
        let puntuacion = 0;
        if (ingresosAnuales >= 5000) { // más de $5,000 USD
            puntuacion += 40;
        }
        else if (ingresosAnuales >= 3000) { // entre $3,000 y $5,000
            puntuacion += 30;
        }
        else {
            puntuacion += 10; // menos de $3,000
        }
        if (cancionesPublicadas >= 10) {
            puntuacion += 30;
        }
        else if (cancionesPublicadas >= 5) {
            puntuacion += 20;
        }
        else {
            puntuacion += 10;
        }
        if (esPropietarioMasters) {
            puntuacion += 20;
        }
        // 5. Evaluar elegibilidad (umbral de 70 puntos)
        const esElegible = puntuacion >= 70;
        // 6. Guardar resultados en la base de datos
        await FinancingModel.createOrUpdateEligibility(artist.id, {
            ingresos_anuales: Math.round(ingresosAnuales * 100), // guardamos en centavos
            numero_canciones_publicadas: cancionesPublicadas,
            es_propietario_masters: esPropietarioMasters,
            puntuacion_total: puntuacion,
            es_elegible: esElegible,
            fecha_ultima_evaluacion: new Date().toISOString()
        });
        res.json({
            mensaje: 'Evaluación completada',
            elegible: esElegible,
            puntuacion,
            detalles: {
                ingresosAnuales,
                cancionesPublicadas,
                esPropietarioMasters
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al evaluar elegibilidad' });
    }
};
exports.evaluarElegibilidad = evaluarElegibilidad;
// ============================================
// OBTENER ESTADO DE ELEGIBILIDAD (para el frontend)
// ============================================
const obtenerMiElegibilidad = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista asociado' });
        const artist = artists[0];
        let eligibility = await FinancingModel.getEligibilityByArtist(artist.id);
        // Si no existe, ejecutamos la evaluación automáticamente
        if (!eligibility) {
            // Redirigimos a la función de evaluación (podríamos llamarla directamente, pero por simplicidad, la ejecutamos aquí)
            return await (0, exports.evaluarElegibilidad)(req, res);
        }
        res.json({
            elegible: eligibility.es_elegible,
            puntuacion: eligibility.puntuacion_total,
            fecha_ultima_evaluacion: eligibility.fecha_ultima_evaluacion
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener elegibilidad' });
    }
};
exports.obtenerMiElegibilidad = obtenerMiElegibilidad;
// ============================================
// SOLICITAR CONSULTORÍA (genera el enlace de tracking)
// ============================================
const solicitarConsultoria = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista asociado' });
        const artist = artists[0];
        const { nombre, telefono } = req.body; // Datos opcionales que puede pedir el formulario
        // 1. Registrar la solicitud (opcional)
        await FinancingModel.createOrUpdateEligibility(artist.id, {
            nombre_completo: nombre || null,
            telefono: telefono || null
        });
        // 2. Obtener la última evaluación para tener la puntuación
        const eligibility = await FinancingModel.getEligibilityByArtist(artist.id);
        const puntuacion = eligibility?.puntuacion_total || 0;
        // 3. Construir el mensaje base (usamos el nombre del artista desde la base de datos)
        const mensajeBase = `Hola, soy ${nombre || artist.name || 'un artista'} de IM MUSIC. Mi ID es ${artist.id} y mi puntuación de elegibilidad es ${puntuacion}. Estoy interesado en recibir asesoría sobre financiación para mi carrera musical.`;
        // 4. Generar la URL de contacto según el método configurado
        const metodo = process.env.FINANCING_CONTACT_METHOD || 'whatsapp';
        let contactUrl = '';
        if (metodo === 'whatsapp') {
            const whatsappNumber = process.env.FINANCING_WHATSAPP_NUMBER;
            if (!whatsappNumber) {
                return res.status(500).json({ error: 'Número de WhatsApp no configurado' });
            }
            contactUrl = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent(mensajeBase)}`;
        }
        else if (metodo === 'email') {
            const email = process.env.FINANCING_EMAIL;
            if (!email) {
                return res.status(500).json({ error: 'Correo de contacto no configurado' });
            }
            const asunto = encodeURIComponent('Solicitud de asesoría financiera desde IM MUSIC');
            const cuerpo = encodeURIComponent(mensajeBase);
            contactUrl = `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
        }
        else {
            return res.status(500).json({ error: 'Método de contacto no válido' });
        }
        res.json({
            mensaje: 'Redirigiendo al canal de atención',
            contactUrl,
            metodo
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar la solicitud' });
    }
};
exports.solicitarConsultoria = solicitarConsultoria;
