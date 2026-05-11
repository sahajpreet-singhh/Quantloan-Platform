import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('quant_loans.db');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_quant_key_123';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL CHECK (role IN ('Investor', 'Borrower')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_id INTEGER REFERENCES users(id),
    company_name TEXT NOT NULL,
    company_description TEXT,
    purpose TEXT,
    amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    tenure INTEGER NOT NULL,
    revenue REAL,
    profit REAL,
    debt REAL,
    cashflow REAL,
    score INTEGER,
    grade TEXT,
    explanation TEXT,
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER REFERENCES users(id),
    loan_id INTEGER REFERENCES loans(id),
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      res.status(400).json({ error: 'Invalid token' });
    }
  };

  // =======================
  // 1. AUTH ROUTES
  // =======================
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, role } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Name, email and role are required' });
    }
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)');
      const info = stmt.run(name, email, role);
      
      const token = jwt.sign({ id: Number(info.lastInsertRowid), role: role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: Number(info.lastInsertRowid), name, email, role } });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already registered. Try signing in.' });
      }
      res.status(500).json({ error: 'Database error: ' + err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return res.status(404).json({ error: 'Account not found. Please create an account first.' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err: any) {
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  });

  // =======================
  // 2. LOAN ROUTES (QUANT LOGIC)
  // =======================
  app.post('/api/loans/request', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'Borrower') return res.status(403).json({ error: 'Only borrowers can request loans' });
    const { company_name, company_description, amount, interest_rate, tenure, revenue, profit, debt, cashflow, purpose } = req.body;

    // Credit Scoring Logic
    let rawScore = (Number(revenue) * 0.3) + (Number(profit) * 0.3) - (Number(debt) * 0.2) + (Number(cashflow) * 0.2);
    let score = Math.max(0, Math.min(100, Math.round(rawScore)));
    let grade = 'C';
    if (score >= 80) grade = 'A';
    else if (score >= 60) grade = 'B';

    let explanation = `Risk Grade ${grade}. `;
    if (Number(debt) > Number(profit)) explanation += "High debt relative to profit increases risk. ";
    if (Number(cashflow) > Number(debt)) explanation += "Strong cashflow minimizes default probability. ";
    if (Number(revenue) > 80 && Number(profit) > 60) explanation += "Solid revenue and margins. ";

    try {
      const stmt = db.prepare(`
        INSERT INTO loans (borrower_id, company_name, company_description, amount, interest_rate, tenure, revenue, profit, debt, cashflow, score, grade, explanation, purpose)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(req.user.id, company_name, company_description, amount, interest_rate, tenure, revenue, profit, debt, cashflow, score, grade, explanation, purpose);
      
      const newLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(info.lastInsertRowid);
      res.json(newLoan);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/loans/marketplace', async (req, res) => {
    try {
      const loans = db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all();
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/loans/:id', async (req, res) => {
    try {
      const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
      res.json(loan);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // =======================
  // 3. INVESTMENT ROUTES
  // =======================
  app.post('/api/investments', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'Investor') return res.status(403).json({ error: 'Only investors can invest' });
    const { loan_id, amount } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO investments (investor_id, loan_id, amount) VALUES (?, ?, ?)');
      const info = stmt.run(req.user.id, loan_id, amount);
      
      const newInv = db.prepare('SELECT * FROM investments WHERE id = ?').get(info.lastInsertRowid);
      res.json({ message: 'Investment successful!', investment: newInv });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/investments/user/:id', authenticateToken, async (req, res) => {
    try {
      const portfolio = db.prepare(`
        SELECT i.id, i.amount as invested_amount, l.company_name, l.grade, l.interest_rate
        FROM investments i
        JOIN loans l ON i.loan_id = l.id
        WHERE i.investor_id = ?
      `).all(req.params.id);
      res.json(portfolio);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
