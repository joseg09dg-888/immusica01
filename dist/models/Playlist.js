"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistById = void 0;
const database_1 = __importDefault(require("../database"));
const getPlaylistById = (id) => {
    return database_1.default.prepare('SELECT * FROM playlists WHERE id = ?').get(id);
};
exports.getPlaylistById = getPlaylistById;
