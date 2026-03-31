"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.updateTaskStatus = exports.getPendingTasks = exports.setEmergencyStop = exports.getAgentConfig = exports.startNgrokTest = exports.createGitHubBranch = exports.getResourceStatus = exports.getSystemLogs = exports.markInboxMessageAsProcessed = exports.getInboxMessages = exports.receiveInboxMessage = void 0;
const database_1 = __importDefault(require("../database"));
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Verificar si el usuario es AI_OPERATOR
const isAiOperator = (user) => user && user.role === 'ai_operator';
// Verificar interruptor de emergencia
const checkEmergencyStop = () => {
    const config = database_1.default.prepare('SELECT emergency_stop FROM ai_agent_config WHERE id = 1').get();
    return config?.emergency_stop === 1;
};
// ============================================
// 1. BUZÓN DE ENTRADA (Correo/API)
// ============================================
// Recibir mensaje en el buzón (puede venir de email, Telegram, etc.)
const receiveInboxMessage = async (req, res) => {
    try {
        const { source, sender, subject, message, priority } = req.body;
        if (!source || !sender || !message) {
            return res.status(400).json({ error: 'source, sender y message son obligatorios' });
        }
        const insert = database_1.default.prepare(`
      INSERT INTO ai_inbox (source, sender, subject, message, priority, status)
      VALUES (?, ?, ?, ?, ?, 'unread')
    `);
        const result = insert.run(source, sender, subject || null, message, priority || 1);
        // Registrar acción
        database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run('inbox_message', `Mensaje de ${sender} desde ${source}`);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Mensaje recibido en el buzón'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al recibir mensaje' });
    }
};
exports.receiveInboxMessage = receiveInboxMessage;
// Obtener mensajes del buzón (para que la IA los procese)
const getInboxMessages = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { status, limit = 50 } = req.query;
        let sql = 'SELECT * FROM ai_inbox';
        const params = [];
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        sql += ' ORDER BY priority DESC, created_at ASC LIMIT ?';
        params.push(Number(limit));
        const messages = database_1.default.prepare(sql).all(...params);
        res.json(messages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};
exports.getInboxMessages = getInboxMessages;
// Marcar mensaje como procesado
const markInboxMessageAsProcessed = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { id } = req.params;
        const { status, taskId } = req.body;
        const update = database_1.default.prepare(`
      UPDATE ai_inbox 
      SET status = ?, assigned_task_id = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        update.run(status || 'resolved', taskId || null, id);
        res.json({ message: 'Mensaje actualizado' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar mensaje' });
    }
};
exports.markInboxMessageAsProcessed = markInboxMessageAsProcessed;
// ============================================
// 2. CONSOLA DE LOGS E INFRAESTRUCTURA
// ============================================
// Obtener logs del sistema (errores, jobs, etc.)
const getSystemLogs = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { lines = 100, level } = req.query;
        // Logs de acciones de IA
        const actionLogs = database_1.default.prepare(`
      SELECT * FROM ai_action_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(Number(lines));
        // Estado de los jobs automáticos
        const jobStatus = {
            releasePublisher: 'running', // Podrías verificar si el proceso está activo
            storeMaximizer: 'running'
        };
        // Estadísticas de la base de datos
        const dbStats = {
            users: database_1.default.prepare('SELECT COUNT(*) as count FROM users').get(),
            tracks: database_1.default.prepare('SELECT COUNT(*) as count FROM tracks').get(),
            feedback: database_1.default.prepare('SELECT COUNT(*) as count FROM feedback').get()
        };
        res.json({
            actionLogs,
            jobStatus,
            dbStats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener logs' });
    }
};
exports.getSystemLogs = getSystemLogs;
// Obtener estado de recursos (CPU/RAM - simulado)
const getResourceStatus = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        // En producción, usarías `os` module para obtener datos reales
        const os = require('os');
        const cpuLoad = os.loadavg()[0] / os.cpus().length;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = (totalMem - freeMem) / totalMem;
        res.json({
            cpu: {
                load: cpuLoad,
                cores: os.cpus().length
            },
            memory: {
                total: totalMem,
                free: freeMem,
                usage: memUsage
            },
            uptime: os.uptime(),
            platform: os.platform(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener recursos' });
    }
};
exports.getResourceStatus = getResourceStatus;
// ============================================
// 3. PUENTE DE CÓDIGO (GitHub + ngrok)
// ============================================
// Crear rama en GitHub
const createGitHubBranch = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        if (checkEmergencyStop()) {
            return res.status(503).json({ error: 'IA detenida por interruptor de emergencia' });
        }
        const { branchName, baseBranch = 'main', filePath, content, commitMessage } = req.body;
        if (!branchName) {
            return res.status(400).json({ error: 'branchName es obligatorio' });
        }
        // Registrar tarea
        const taskInsert = database_1.default.prepare(`
      INSERT INTO ai_tasks (task_type, status, input_data, started_at)
      VALUES (?, 'in_progress', ?, ?)
    `);
        const taskResult = taskInsert.run('github_branch', JSON.stringify({ branchName, baseBranch, filePath, commitMessage }), new Date().toISOString());
        const taskId = taskResult.lastInsertRowid;
        // Aquí iría la lógica real con GitHub API
        // Por ahora simulamos:
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Actualizar tarea como completada
        database_1.default.prepare(`
      UPDATE ai_tasks 
      SET status = 'completed', completed_at = ?, output_data = ?
      WHERE id = ?
    `).run(new Date().toISOString(), JSON.stringify({ branchUrl: `https://github.com/yourrepo/tree/${branchName}` }), taskId);
        // Registrar acción
        database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run('github_create_branch', `Rama ${branchName} creada desde ${baseBranch}`);
        res.json({
            taskId,
            message: 'Rama creada (simulada)',
            branchName
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear rama' });
    }
};
exports.createGitHubBranch = createGitHubBranch;
// Levantar ngrok para pruebas
const startNgrokTest = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        if (checkEmergencyStop()) {
            return res.status(503).json({ error: 'IA detenida por interruptor de emergencia' });
        }
        const { port = 3000, subdomain } = req.body;
        // Simular ngrok (en producción ejecutarías el comando real)
        const ngrokUrl = subdomain
            ? `https://${subdomain}.ngrok-free.app`
            : `https://random-${Date.now()}.ngrok-free.app`;
        // Probar conexión al endpoint de health
        try {
            const testResponse = await axios_1.default.get(`${ngrokUrl}/api/health`, { timeout: 5000 });
            const testResult = testResponse.data;
            // Registrar prueba exitosa
            database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run('ngrok_test', JSON.stringify({ url: ngrokUrl, result: testResult }));
            res.json({
                success: true,
                ngrokUrl,
                testResult,
                message: 'Prueba con ngrok exitosa'
            });
        }
        catch (err) {
            // Registrar fallo
            database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run('ngrok_test', `Fallo al conectar con ${ngrokUrl}: ${err.message}`);
            res.status(500).json({
                error: 'Fallo al conectar con ngrok',
                ngrokUrl,
                details: err.message
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar prueba ngrok' });
    }
};
exports.startNgrokTest = startNgrokTest;
// ============================================
// 4. INTERRUPTOR DE EMERGENCIA
// ============================================
// Obtener configuración actual
const getAgentConfig = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const config = database_1.default.prepare('SELECT * FROM ai_agent_config WHERE id = 1').get();
        if (!config) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        // Crear una copia sin los tokens sensibles
        const safeConfig = { ...config };
        delete safeConfig.github_token_encrypted;
        delete safeConfig.telegram_bot_token;
        delete safeConfig.whatsapp_api_key;
        res.json(safeConfig);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};
exports.getAgentConfig = getAgentConfig;
// Activar/desactivar interruptor de emergencia
const setEmergencyStop = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { stop } = req.body;
        if (typeof stop !== 'boolean') {
            return res.status(400).json({ error: 'stop debe ser booleano' });
        }
        database_1.default.prepare('UPDATE ai_agent_config SET emergency_stop = ? WHERE id = 1').run(stop ? 1 : 0);
        // Registrar acción
        database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run('emergency_stop', `Interruptor ${stop ? 'activado' : 'desactivado'} por ${req.user.email}`);
        res.json({ message: `Interruptor de emergencia ${stop ? 'activado' : 'desactivado'}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar interruptor' });
    }
};
exports.setEmergencyStop = setEmergencyStop;
// ============================================
// 5. GESTIÓN DE TAREAS
// ============================================
// Obtener tareas pendientes
const getPendingTasks = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const tasks = database_1.default.prepare(`
      SELECT * FROM ai_tasks 
      WHERE status IN ('pending', 'in_progress')
      ORDER BY priority DESC, created_at ASC
      LIMIT 100
    `).all();
        res.json(tasks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
};
exports.getPendingTasks = getPendingTasks;
// Actualizar estado de una tarea
const updateTaskStatus = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { id } = req.params;
        const { status, output_data, error_message } = req.body;
        const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
        database_1.default.prepare(`
      UPDATE ai_tasks 
      SET status = ?, output_data = ?, error_message = ?, completed_at = ?
      WHERE id = ?
    `).run(status, output_data || null, error_message || null, completedAt, id);
        res.json({ message: 'Tarea actualizada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
};
exports.updateTaskStatus = updateTaskStatus;
// ============================================
// 6. SISTEMA DE NOTIFICACIONES
// ============================================
// Enviar notificación (Telegram/WhatsApp simulados)
const sendNotification = async (req, res) => {
    try {
        if (!req.user || !isAiOperator(req.user)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const { channel, recipient, message } = req.body;
        if (!channel || !recipient || !message) {
            return res.status(400).json({ error: 'channel, recipient y message son obligatorios' });
        }
        // Aquí iría la integración real con Telegram/WhatsApp API
        console.log(`[${channel.toUpperCase()}] Enviando a ${recipient}: ${message}`);
        // Registrar notificación
        database_1.default.prepare('INSERT INTO ai_action_logs (action, details) VALUES (?, ?)').run(`notification_${channel}`, JSON.stringify({ recipient, message: message.substring(0, 100) }));
        res.json({
            success: true,
            message: 'Notificación enviada (simulada)'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar notificación' });
    }
};
exports.sendNotification = sendNotification;
