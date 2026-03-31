"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSplitsByTrack = exports.createSplit = exports.updateUploadItem = exports.getUploadItemsByJob = exports.createUploadItem = exports.updateUploadJob = exports.getUploadJobById = exports.createUploadJob = void 0;
const database_1 = __importDefault(require("../config/database"));
// ========== JOBS ==========
const createUploadJob = (artistId) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO upload_jobs (artist_id, status, progress, total_items, processed_items)
    VALUES (?, 'pending', 0, 0, 0)
  `);
    return stmt.run(artistId);
};
exports.createUploadJob = createUploadJob;
const getUploadJobById = (id) => {
    return database_1.default.prepare('SELECT * FROM upload_jobs WHERE id = ?').get(id);
};
exports.getUploadJobById = getUploadJobById;
const updateUploadJob = (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = database_1.default.prepare(`UPDATE upload_jobs SET ${fields} WHERE id = ?`);
    return stmt.run(...values, id);
};
exports.updateUploadJob = updateUploadJob;
// ========== ITEMS ==========
const createUploadItem = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO upload_items (
      job_id, original_filename, file_path, file_type, mime_type, file_size,
      extracted_data, suggested_track_id, status, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(data.job_id, data.original_filename, data.file_path, data.file_type, data.mime_type, data.file_size, data.extracted_data, data.suggested_track_id, data.status, data.error);
};
exports.createUploadItem = createUploadItem;
const getUploadItemsByJob = (jobId) => {
    return database_1.default.prepare('SELECT * FROM upload_items WHERE job_id = ? ORDER BY id').all(jobId);
};
exports.getUploadItemsByJob = getUploadItemsByJob;
const updateUploadItem = (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = database_1.default.prepare(`UPDATE upload_items SET ${fields} WHERE id = ?`);
    return stmt.run(...values, id);
};
exports.updateUploadItem = updateUploadItem;
// ========== SPLITS ==========
const createSplit = (data) => {
    const stmt = database_1.default.prepare(`
    INSERT INTO splits (track_id, artist_name, role, percentage, contract_ref)
    VALUES (?, ?, ?, ?, ?)
  `);
    return stmt.run(data.track_id, data.artist_name, data.role, data.percentage, data.contract_ref);
};
exports.createSplit = createSplit;
const getSplitsByTrack = (trackId) => {
    return database_1.default.prepare('SELECT * FROM splits WHERE track_id = ?').all(trackId);
};
exports.getSplitsByTrack = getSplitsByTrack;
