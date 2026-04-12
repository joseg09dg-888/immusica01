import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: any) {
    const message = err.errors?.[0]?.message || 'Datos inválidos';
    res.status(400).json({ error: message });
  }
};

export const schemas = {
  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
  }),
  register: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    name: z.string().min(2, 'Nombre requerido'),
  }),
  createTrack: z.object({
    title: z.string().min(1, 'Título requerido').max(200, 'Título muy largo'),
    genre: z.string().optional(),
    isrc: z.string().optional(),
    upc: z.string().optional(),
    release_date: z.string().optional(),
    scheduled_date: z.string().optional(),
    auto_distribute: z.boolean().optional(),
  }),
  updateTrack: z.object({
    title: z.string().min(1).max(200).optional(),
    genre: z.string().optional(),
    status: z.string().optional(),
    isrc: z.string().optional(),
    release_date: z.string().optional(),
  }),
  createSplit: z.object({
    name: z.string().min(1, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    percentage: z.number().min(0.01, 'Porcentaje mínimo 0.01').max(100, 'Porcentaje máximo 100'),
    role: z.string().optional(),
  }),
  createRelease: z.object({
    title: z.string().min(1, 'Título requerido'),
    scheduled_date: z.string().optional(),
    platforms: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.string().optional(),
  }),
  submitRoyalty: z.object({
    track_id: z.number({ message: 'track_id requerido' }),
    fecha: z.string().min(1, 'Fecha requerida'),
    plataforma: z.string().min(1, 'Plataforma requerida'),
    cantidad: z.number().min(0, 'Cantidad debe ser positiva'),
    estado: z.string().optional(),
  }),
  createFeedback: z.object({
    type: z.string().min(1, 'Tipo requerido'),
    title: z.string().min(1, 'Título requerido'),
    description: z.string().min(10, 'Descripción mínimo 10 caracteres'),
  }),
  updateProfile: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    currentPassword: z.string().optional(),
  }),
};
