import db from '../config/database';

export interface Feedback {
  id?: number;
  user_id: number;
  type: 'suggestion' | 'bug' | 'feature_request';
  title: string;
  description: string;
  status: 'pending' | 'reviewing' | 'implemented' | 'rejected';
  admin_notes?: string;
  created_at?: string;
}

export const initFeedbackTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('suggestion', 'bug', 'feature_request')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'reviewing', 'implemented', 'rejected')) DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
};

export const createFeedback = (feedback: Feedback) => {
  return db.prepare(`
    INSERT INTO feedback (user_id, type, title, description)
    VALUES (?, ?, ?, ?)
  `).run(feedback.user_id, feedback.type, feedback.title, feedback.description);
};

export const getFeedbackByUser = (userId: number) => {
  return db.prepare('SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC').all(userId);
};

export const getAllFeedback = () => {
  return db.prepare(`
    SELECT f.*, u.name as user_name, u.email as user_email 
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `).all();
};

export const updateFeedbackStatus = (id: number, status: string, admin_notes?: string) => {
  return db.prepare(`
    UPDATE feedback 
    SET status = ?, admin_notes = ?
    WHERE id = ?
  `).run(status, admin_notes, id);
};

export const getFeedbackById = (id: number) => {
  return db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
};
