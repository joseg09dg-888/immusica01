import db from '../config/database';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
}

export const createUser = (email: string, password: string, name: string, role = 'artist') => {
  const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  return stmt.run(email, password, name, role);
};

export const findUserByEmail = (email: string): User | undefined => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
};

export const findUserById = (id: number): User | undefined => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
};
