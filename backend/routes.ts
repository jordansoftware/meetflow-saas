import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-dev';

interface DecodedToken {
  userId: number;
  role: string;
}

// Simulated Email Notification System
const sendEmail = (to: string, subject: string, text: string) => {
  console.log(`\n[EMAIL MOCK - TO: ${to}]\nSubject: ${subject}\n${text}\n-----------------------------------\n`);
};

// Custom Middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const optionalToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      (req as any).user = jwt.verify(token, JWT_SECRET);
    } catch (error) {}
  }
  next();
};

// --- Auth Routes ---
router.post('/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Required fields missing' });
    return;
  }
  
  const userRole = role === 'professional' ? 'professional' : 'client';
  
  // Auto-generate username from name (e.g. "John Doe" -> "johndoe123")
  const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, name, username, role) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(email, hashedPassword, name, username, userRole);
    
    const token = jwt.sign({ userId: result.lastInsertRowid, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email, name, username, role: userRole } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
       res.status(409).json({ error: 'Email or username already exists' });
    } else {
       res.status(500).json({ error: 'Database error' });
    }
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role } });
});

router.get('/auth/me', authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const user = db.prepare('SELECT id, email, name, username, role, timezone FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

// --- Public Profiling ---
router.get('/professionals', authenticateToken, (req, res) => {
  const professionals = db.prepare("SELECT id, name, username, email FROM users WHERE role = 'professional'").all();
  res.json(professionals);
});

router.get('/public/u/:username', (req, res) => {
  const pro: any = db.prepare('SELECT id, name, username, email, role FROM users WHERE username = ? AND role = "professional"').get(req.params.username);
  if (!pro) {
    res.status(404).json({ error: 'Professional not found' });
    return;
  }

  // Get available slots
  const slots = db.prepare('SELECT id, start_time, end_time FROM availability_slots WHERE professional_id = ? AND is_booked = 0 ORDER BY start_time ASC').all(pro.id);
  res.json({ professional: pro, slots });
});

// --- Professional/Analytics API ---
router.get('/analytics', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'professional') {
    res.status(403).json({ error: 'Professional only' });
    return;
  }

  const totalBookings = db.prepare(`
    SELECT count(*) as count FROM appointments a 
    JOIN availability_slots s ON a.slot_id = s.id 
    WHERE s.professional_id = ? AND a.status = 'booked'
  `).get(user.userId) as any;

  const noShows = db.prepare(`
    SELECT count(*) as count FROM appointments a 
    JOIN availability_slots s ON a.slot_id = s.id 
    WHERE s.professional_id = ? AND a.no_show = 1
  `).get(user.userId) as any;

  const history = db.prepare(`
    SELECT a.id, a.status, a.no_show, s.start_time, s.end_time, 
           COALESCE(u.name, a.guest_name) as client_name 
    FROM appointments a
    JOIN availability_slots s ON a.slot_id = s.id
    LEFT JOIN users u ON a.client_id = u.id
    WHERE s.professional_id = ?
    ORDER BY s.start_time DESC LIMIT 10
  `).all(user.userId);

  res.json({
    totalBookings: totalBookings.count,
    noShows: noShows.count,
    history
  });
});

// --- Smart Scheduling ---
router.post('/slots/generate', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'professional') {
    res.status(403).json({ error: 'Professional only' });
    return;
  }
  
  const { date, start_hour, end_hour, duration_minutes } = req.body; 
  // Ex: date = '2026-04-20', start_hour = '09:00', end_hour = '17:00', duration_minutes = 30
  
  const startObj = new Date(`${date}T${start_hour}:00.000Z`); // using UTC for simplicity
  const endObj = new Date(`${date}T${end_hour}:00.000Z`);
  const durationMs = duration_minutes * 60 * 1000;

  try {
    let current = startObj.getTime();
    let end = endObj.getTime();
    
    // Check overlaps
    const existingSlots = db.prepare('SELECT start_time, end_time FROM availability_slots WHERE professional_id = ?').all(user.userId) as any[];

    const generateTransaction = db.transaction(() => {
      let created = 0;
      while (current + durationMs <= end) {
        const sTime = new Date(current).toISOString();
        const eTime = new Date(current + durationMs).toISOString();

        // Overlap logic
        const overlap = existingSlots.some(es => 
           (new Date(es.start_time).toISOString() < eTime) && (new Date(es.end_time).toISOString() > sTime)
        );

        if (!overlap) {
          db.prepare('INSERT INTO availability_slots (professional_id, start_time, end_time) VALUES (?, ?, ?)').run(user.userId, sTime, eTime);
          created++;
        }
        current += durationMs;
      }
      return created;
    });

    const count = generateTransaction();
    res.status(201).json({ success: true, createdCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Standard Slot Management
router.get('/slots', authenticateToken, (req, res) => {
  const professionalId = req.query.professionalId || (req as any).user.userId;
  const slots = db.prepare('SELECT * FROM availability_slots WHERE professional_id = ? ORDER BY start_time ASC').all(professionalId);
  res.json(slots);
});

router.post('/slots', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'professional') {
    res.status(403).json({ error: 'Requires professional role' });
    return;
  }
  
  const { start_time, end_time } = req.body;
  if (!start_time || !end_time) {
    res.status(400).json({ error: 'Required' });
    return;
  }

  // Conflict check
  const conflict = db.prepare('SELECT id FROM availability_slots WHERE professional_id = ? AND start_time < ? AND end_time > ?').get(user.userId, end_time, start_time);
  if (conflict) {
    res.status(400).json({ error: 'Overlapping slot exists' });
    return;
  }

  const result = db.prepare('INSERT INTO availability_slots (professional_id, start_time, end_time) VALUES (?, ?, ?)').run(user.userId, start_time, end_time);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.delete('/slots/:id', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const result = db.prepare('DELETE FROM availability_slots WHERE id = ? AND professional_id = ? AND is_booked = 0').run(req.params.id, user.userId);
  if (result.changes === 0) {
    res.status(400).json({ error: 'Failed to delete' });
    return;
  }
  res.json({ success: true });
});

// --- Appointments & Bookings ---
router.get('/appointments', authenticateToken, (req, res) => {
  const user = (req as any).user;
  let appointments;
  
  if (user.role === 'professional') {
    appointments = db.prepare(`
      SELECT a.*, s.start_time, s.end_time, 
             COALESCE(u.name, a.guest_name) as client_name, 
             COALESCE(u.email, a.guest_email) as client_email
      FROM appointments a
      JOIN availability_slots s ON a.slot_id = s.id
      LEFT JOIN users u ON a.client_id = u.id
      WHERE s.professional_id = ? AND a.status != 'rescheduled'
      ORDER BY s.start_time ASC
    `).all(user.userId);
  } else {
    appointments = db.prepare(`
      SELECT a.*, s.start_time, s.end_time, u.name as professional_name, u.email as professional_email
      FROM appointments a
      JOIN availability_slots s ON a.slot_id = s.id
      JOIN users u ON s.professional_id = u.id
      WHERE a.client_id = ? AND a.status != 'rescheduled'
      ORDER BY s.start_time ASC
    `).all(user.userId);
  }
  res.json(appointments);
});

router.post('/appointments/book', optionalToken, (req, res) => {
  const user = (req as any).user; // might be undefined for guests
  const { slot_id, guest_name, guest_email } = req.body;
  
  try {
    const bookTransaction = db.transaction(() => {
      const slot = db.prepare('SELECT s.*, u.email as pro_email, u.name as pro_name FROM availability_slots s JOIN users u ON s.professional_id = u.id WHERE s.id = ?').get(slot_id) as any;
      if (!slot) throw new Error('Slot does not exist');
      if (slot.is_booked === 1) throw new Error('Time slot is currently booked or unavailable');
      
      const clientId = user ? user.userId : null;
      if (!clientId && (!guest_name || !guest_email)) throw new Error('Guest details required');

      db.prepare('UPDATE availability_slots SET is_booked = 1 WHERE id = ?').run(slot_id);
      const appRes = db.prepare('INSERT INTO appointments (slot_id, client_id, guest_name, guest_email) VALUES (?, ?, ?, ?)').run(slot_id, clientId, guest_name || null, guest_email || null);
      
      const clientEmailToNotify = user ? db.prepare('SELECT email FROM users WHERE id=?').get(user.userId) : guest_email;
      return { id: appRes.lastInsertRowid, pro_email: slot.pro_email, client_email: (clientEmailToNotify as any)?.email || guest_email, date: slot.start_time };
    });
    
    const result = bookTransaction() as any;
    
    // Trigger Emails
    sendEmail(result.client_email, 'Booking Confirmed!', `You are successfully booked for ${new Date(result.date).toLocaleString()}`);
    sendEmail(result.pro_email, 'New Appointment', `You have a new booking at ${new Date(result.date).toLocaleString()}`);

    res.status(201).json({ success: true, appointmentId: result.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reschedule
router.post('/appointments/:id/reschedule', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const oldApptId = req.params.id;
  const { new_slot_id } = req.body;

  try {
    const rescheduleTransaction = db.transaction(() => {
      const oldAppt = db.prepare('SELECT a.*, s.professional_id FROM appointments a JOIN availability_slots s ON a.slot_id = s.id WHERE a.id = ?').get(oldApptId) as any;
      if (!oldAppt || oldAppt.status !== 'booked') throw new Error('Invalid appointment');
      if (user.role === 'client' && oldAppt.client_id !== user.userId) throw new Error('Unauthorized');
      
      // Check new slot
      const newSlot = db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(new_slot_id) as any;
      if (!newSlot || newSlot.is_booked === 1 || newSlot.professional_id !== oldAppt.professional_id) throw new Error('New slot invalid or booked');

      // Free old slot
      db.prepare('UPDATE availability_slots SET is_booked = 0 WHERE id = ?').run(oldAppt.slot_id);
      db.prepare('UPDATE appointments SET status = "rescheduled" WHERE id = ?').run(oldApptId);

      // Book new slot
      db.prepare('UPDATE availability_slots SET is_booked = 1 WHERE id = ?').run(new_slot_id);
      db.prepare('INSERT INTO appointments (slot_id, client_id, guest_name, guest_email) VALUES (?, ?, ?, ?)').run(new_slot_id, oldAppt.client_id, oldAppt.guest_name, oldAppt.guest_email);
    });
    
    rescheduleTransaction();
    sendEmail('user@mock.com', 'Reschedule Successful', 'Your appointment has been perfectly rescheduled.');
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mark No-Show
router.post('/appointments/:id/no-show', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'professional') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  const result = db.prepare('UPDATE appointments SET no_show = 1 WHERE id = ? AND slot_id IN (SELECT id FROM availability_slots WHERE professional_id = ?)').run(req.params.id, user.userId);
  if (result.changes === 0) {
    res.status(400).json({ error: 'Failed' });
    return;
  }
  res.json({ success: true });
});

// Cancel
router.delete('/appointments/:id', authenticateToken, (req, res) => {
  const user = (req as any).user;
  try {
    const cancelTx = db.transaction(() => {
      const appt = db.prepare('SELECT a.*, s.professional_id FROM appointments a JOIN availability_slots s ON a.slot_id = s.id WHERE a.id = ?').get(req.params.id) as any;
      if (!appt || appt.status !== 'booked') throw new Error('Invalid');
      if (user.role === 'client' && appt.client_id !== user.userId) throw new Error('Unauthorized');
      if (user.role === 'professional' && appt.professional_id !== user.userId) throw new Error('Unauthorized');
      
      db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);
      db.prepare('UPDATE availability_slots SET is_booked = 0 WHERE id = ?').run(appt.slot_id);
    });
    cancelTx();
    sendEmail('user@mock.com', 'Cancellation Notice', 'The appointment was completely cancelled.');
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
