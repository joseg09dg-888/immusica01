import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as FeedbackModel from '../models/Feedback';

export const submitFeedback = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { type, title, description } = req.body;
  if (!type || !title || !description) {
    return res.status(400).json({ error: 'Type, title and description are required' });
  }

  try {
    FeedbackModel.createFeedback({
      user_id: req.user.id,
      type,
      title,
      description,
      status: 'pending'
    });
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const getMyFeedback = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const feedback = FeedbackModel.getFeedbackByUser(req.user.id);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

export const getAllFeedback = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const feedback = FeedbackModel.getAllFeedback();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all feedback' });
  }
};

export const updateFeedback = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    FeedbackModel.updateFeedbackStatus(Number(id), status, admin_notes);
    res.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};
