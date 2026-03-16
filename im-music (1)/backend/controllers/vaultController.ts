import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as VaultModel from '../models/Vault';
import * as ArtistModel from '../models/Artist';

export const getVaultFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const files = VaultModel.getVaultFilesByArtist(artists[0].id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener archivos del Vault' });
  }
};

export const uploadToVault = async (req: any, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const { name } = req.body;
    const fileUrl = req.file.path;
    const fileType = req.file.mimetype;
    const fileSize = req.file.size;
    
    VaultModel.createVaultFile(artists[0].id, name || req.file.originalname, fileUrl, fileType, fileSize);
    
    res.json({ message: 'Archivo guardado en el Vault', url: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir al Vault' });
  }
};

export const deleteFromVault = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    VaultModel.deleteVaultFile(parseInt(id));
    res.json({ message: 'Archivo eliminado del Vault' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar del Vault' });
  }
};
