"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginEmail = exports.callback = exports.login = void 0;
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../database"));
const spotifyApi = new spotify_web_api_node_1.default({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const login = (req, res) => {
    const scopes = [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-modify-public'
    ];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state-123');
    res.redirect(authorizeURL);
};
exports.login = login;
const callback = async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('No se recibió el código de autorización');
    }
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;
        global.spotifyAccessToken = access_token;
        global.spotifyRefreshToken = refresh_token;
        res.send(`
      <h1>✅ Autenticación exitosa</h1>
      <p>Ya puedes usar <strong>/api/mood/recommendations?mood=alegre</strong></p>
      <a href="/api/mood/recommendations?mood=alegre">Probar ahora</a>
    `);
    }
    catch (error) {
        console.error('Error al obtener token:', error);
        res.status(500).send('Error al autenticar con Spotify');
    }
};
exports.callback = callback;
const loginEmail = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }
        // Buscar usuario en la base de datos
        const user = database_1.default.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Verificar contraseña
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Generar JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Error en login email:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
exports.loginEmail = loginEmail;
