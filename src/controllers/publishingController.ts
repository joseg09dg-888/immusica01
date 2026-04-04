import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import { PROIntegrationService } from '../services/proIntegrationService';

// ============================================
// INTERFACES PARA TIPADO
// ============================================

interface ComposerRow {
  id: number;
  user_id: number | null;
  full_name: string;
  email: string | null;
  pro_affiliation: string | null;
  pro_number: string | null;
  ipi: string | null;
}

interface CompositionRow {
  id: number;
  title: string;
  iswc: string | null;
  language: string | null;
  duration_seconds: number | null;
  lyrics: string | null;
  created_at: string;
  updated_at: string;
}

interface CompositionWithSplits extends CompositionRow {
  composer_data: string | null; // concatenado de roles, porcentajes, nombres, etc.
}

interface CompositionSplitRow {
  id: number;
  composition_id: number;
  composer_id: number;
  role: string | null;
  percentage: number;
  ownership_type: string;
}

interface TotalsRow {
  total_publishing: number | null;
  mechanical_total: number | null;
  performance_total: number | null;
  sync_total: number | null;
}

// ============================================
// GESTIÓN DE COMPOSITORES
// ============================================

export const createComposer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const { full_name, email, pro_affiliation, pro_number, ipi } = req.body;
    
    if (!full_name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    
    const result = await db.prepare(`
      INSERT INTO composers (full_name, email, pro_affiliation, pro_number, ipi)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      full_name,
      email || null,
      pro_affiliation || null,
      pro_number || null,
      ipi || null
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Compositor creado correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear compositor' });
  }
};

export const getComposers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const userComposers = await db.prepare(`
      SELECT c.* FROM composers c
      WHERE c.user_id = ?
    `).all(req.user.id) as ComposerRow[];
    
    const externalComposers = await db.prepare(`
      SELECT DISTINCT c.* FROM composers c
      JOIN composition_splits cs ON c.id = cs.composer_id
      JOIN compositions comp ON cs.composition_id = comp.id
      JOIN track_compositions tc ON comp.id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      JOIN artists a ON t.artist_id = a.id
      WHERE a.user_id = ? AND c.user_id IS NULL
    `).all(req.user.id) as ComposerRow[];
    
    res.json({
      userComposers,
      externalComposers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener compositores' });
  }
};

// ============================================
// GESTIÓN DE OBRAS (COMPOSICIONES)
// ============================================

export const createComposition = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const { title, language, duration_seconds, lyrics, track_ids } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    
    const result = await db.prepare(`
      INSERT INTO compositions (title, language, duration_seconds, lyrics)
      VALUES (?, ?, ?, ?)
    `).run(
      title,
      language || null,
      duration_seconds || null,
      lyrics || null
    );

    const compositionId = result.lastInsertRowid;

    if (track_ids && Array.isArray(track_ids)) {
      for (const trackId of track_ids) {
        await db.prepare(`INSERT INTO track_compositions (track_id, composition_id) VALUES (?, ?)`).run(trackId, compositionId);
      }
    }
    
    res.status(201).json({
      id: compositionId,
      message: 'Composición creada correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear composición' });
  }
};

export const assignCompositionSplits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const { compositionId } = req.params;
    const { splits } = req.body; // Array de { composer_id, role, percentage }
    
    if (!splits || !Array.isArray(splits)) {
      return res.status(400).json({ error: 'Splits debe ser un array' });
    }
    
    const total = splits.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ error: 'La suma de porcentajes debe ser 100%' });
    }
    
    await db.prepare('DELETE FROM composition_splits WHERE composition_id = ?').run(compositionId);
    
    for (const split of splits) {
      await db.prepare(`INSERT INTO composition_splits (composition_id, composer_id, role, percentage) VALUES (?, ?, ?, ?)`).run(
        compositionId, split.composer_id, split.role || 'composer', split.percentage
      );
    }
    
    res.json({ message: 'Splits asignados correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar splits' });
  }
};

// ============================================
// REGISTRO EN SOCIEDADES DE GESTIÓN (PROs)
// ============================================

export const registerWithPRO = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const { compositionId } = req.params;
    const { pro_name } = req.body;
    
    if (!pro_name) {
      return res.status(400).json({ error: 'Nombre de PRO es obligatorio' });
    }
    
    // Obtener datos de la composición y splits, con tipado explícito
    const composition = await db.prepare(`
      SELECT c.*, 
      GROUP_CONCAT(cs.role || ':' || cs.percentage || ':' || comp.full_name || ':' || comp.pro_number) as composer_data
      FROM compositions c
      LEFT JOIN composition_splits cs ON c.id = cs.composition_id
      LEFT JOIN composers comp ON cs.composer_id = comp.id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(compositionId) as (CompositionRow & { composer_data: string | null }) | undefined;
    
    if (!composition) {
      return res.status(404).json({ error: 'Composición no encontrada' });
    }
    
    // Parsear composer_data para construir el array de compositores
    const composers: Array<{ name: string; role: string; share: number; pro?: string }> = [];
    if (composition.composer_data) {
      const parts = composition.composer_data.split(',');
      for (const p of parts) {
        const [role, percentage, name, proNumber] = p.split(':');
        composers.push({
          name,
          role,
          share: parseFloat(percentage),
          pro: proNumber || undefined
        });
      }
    }

    const submissionData = {
      workTitle: composition.title,
      iswc: composition.iswc || undefined,
      composers
    };
    
    const result = await PROIntegrationService.submitToPRO(pro_name, submissionData);
    
    await db.prepare(`
      INSERT INTO composition_registrations 
      (composition_id, pro_name, registration_number, status, response_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      compositionId,
      pro_name,
      result.registration_number || `REG-${Date.now()}`,
      'pending',
      JSON.stringify(result)
    );
    
    res.json({
      message: `Composición enviada a ${pro_name}`,
      result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar en PRO' });
  }
};

// ============================================
// RECAUDACIÓN Y DISTRIBUCIÓN
// ============================================

export const addPublishingRoyalty = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const { composition_id, track_id, fecha, plataforma, tipo, cantidad, territorio, uso_categoria } = req.body;
    
    if (!composition_id || !fecha || !plataforma || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    const result = await db.prepare(`
      INSERT INTO publishing_royalties
      (composition_id, track_id, fecha, plataforma, tipo, cantidad, territorio, uso_categoria)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      composition_id, track_id || null, fecha, plataforma, tipo || null, cantidad, territorio || null, uso_categoria || null
    );

    const royaltyId = result.lastInsertRowid;

    const splits = await db.prepare(`SELECT * FROM composition_splits WHERE composition_id = ?`).all(composition_id) as CompositionSplitRow[];

    if (splits.length > 0) {
      for (const split of splits) {
        const amount = (cantidad * split.percentage) / 100;
        await db.prepare(`INSERT INTO publishing_distributions (publishing_royalty_id, composer_id, amount, percentage_applied) VALUES (?, ?, ?, ?)`).run(royaltyId, split.composer_id, amount, split.percentage);
      }
    }
    
    res.status(201).json({
      id: royaltyId,
      message: 'Regalía editorial registrada'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar regalía editorial' });
  }
};

export const getPublishingSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json({ total: 0, compositions: [] });
    
    const artistId = artists[0].id;
    
    const compositions = await db.prepare(`
      SELECT DISTINCT c.*, 
      (SELECT SUM(pr.cantidad) FROM publishing_royalties pr WHERE pr.composition_id = c.id) as total_earned,
      (SELECT COUNT(*) FROM publishing_royalties pr WHERE pr.composition_id = c.id) as royalty_count
      FROM compositions c
      JOIN track_compositions tc ON c.id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      WHERE t.artist_id = ?
      ORDER BY c.created_at DESC
    `).all(artistId) as (CompositionRow & { total_earned: number | null; royalty_count: number })[];
    
    const totals = await db.prepare(`
      SELECT 
        SUM(pr.cantidad) as total_publishing,
        SUM(CASE WHEN pr.tipo = 'mechanical' THEN pr.cantidad ELSE 0 END) as mechanical_total,
        SUM(CASE WHEN pr.tipo = 'performance' THEN pr.cantidad ELSE 0 END) as performance_total,
        SUM(CASE WHEN pr.tipo = 'sync' THEN pr.cantidad ELSE 0 END) as sync_total
      FROM publishing_royalties pr
      JOIN track_compositions tc ON pr.composition_id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId) as TotalsRow | undefined;
    
    res.json({
      total_publishing: totals?.total_publishing || 0,
      mechanical_total: totals?.mechanical_total || 0,
      performance_total: totals?.performance_total || 0,
      sync_total: totals?.sync_total || 0,
      compositions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen editorial' });
  }
};