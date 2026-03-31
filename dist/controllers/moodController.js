"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = void 0;
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const moodService_1 = require("../services/moodService");
const spotifyApi = new spotify_web_api_node_1.default({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});
const getRecommendations = async (req, res) => {
    try {
        const { mood, limit = 10 } = req.query;
        if (!mood) {
            return res.status(400).json({ error: 'El parámetro "mood" es requerido' });
        }
        const recommendations = await (0, moodService_1.getRecommendationsForMood)(spotifyApi, mood, Number(limit));
        res.json(recommendations);
    }
    catch (error) {
        console.error('Error en getRecommendations:', error);
        res.status(500).json({
            error: 'Error al obtener recomendaciones de Spotify',
            details: error.message,
            code: error.code || 'UNKNOWN',
        });
    }
};
exports.getRecommendations = getRecommendations;
