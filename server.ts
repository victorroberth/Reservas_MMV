
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Server Diagnostic ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL present:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('-------------------------');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseClient: any = null;

function getSupabase(): any {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Configuração do Supabase ausente. Verifique se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados no Settings do AI Studio ou no Dashboard do Vercel.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  app.use(express.json());
  app.use(cors());

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(), 
      env: process.env.NODE_ENV,
      cwd: process.cwd()
    });
  });

  // API Routes
  
  // Auth (Simple)
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await getSupabase()
        .from('users')
        .select('id, name, email, role')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (user && !error) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users CRUD
  app.get('/api/users', async (req, res) => {
    try {
      const { data: users, error } = await getSupabase()
        .from('users')
        .select('id, name, email, role');
      
      if (error) return res.status(500).json({ error: error.message });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const { data, error } = await getSupabase()
        .from('users')
        .insert([{ name, email, password, role: role || 'teacher' }])
        .select();

      if (error) {
        if (error.code === '23505') {
          res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        } else {
          res.status(500).json({ error: error.message });
        }
        return;
      }
      res.json({ id: data[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { name, email, password, role } = req.body;
    const updates: any = { name, email, role };
    if (password) updates.password = password;

    try {
      const { error } = await getSupabase()
        .from('users')
        .update(updates)
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { error } = await getSupabase()
        .from('users')
        .delete()
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resources
  app.get('/api/resources', async (req, res) => {
    try {
      const { data: resources, error } = await getSupabase()
        .from('resources')
        .select('*')
        .order('name');
      
      if (error) return res.status(500).json({ error: error.message });
      res.json(resources);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/resources', async (req, res) => {
    const { name, type, description, active } = req.body;
    try {
      const { data, error } = await getSupabase()
        .from('resources')
        .insert([{ name, type, description, active: active ?? true }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      res.json({ id: data[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/resources/:id', async (req, res) => {
    const { name, type, description, active } = req.body;
    try {
      const { error } = await getSupabase()
        .from('resources')
        .update({ name, type, description, active: active ?? true })
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/resources/:id', async (req, res) => {
    try {
      const { error } = await getSupabase()
        .from('resources')
        .delete()
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reservations
  app.get('/api/reservations', async (req, res) => {
    const { date } = req.query;
    
    try {
      let query = getSupabase()
        .from('reservations')
        .select(`
          *,
          resource:resources(name, type)
        `);

      if (date) {
        query = query.eq('reservation_date', date);
      }
      
      const { data: reservations, error } = await query.order('start_time', { ascending: true });
      
      if (error) return res.status(500).json({ error: error.message });
      
      // Flatten result to match previous SQLite format
      const flattened = (reservations || []).map(r => ({
        ...r,
        resource_name: (r.resource as any)?.name,
        resource_type: (r.resource as any)?.type
      }));
      
      res.json(flattened);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reservations', async (req, res) => {
    const { 
      resource_id, user_id, responsible_name, group_or_sector, 
      reservation_date, start_time, end_time, observation 
    } = req.body;

    try {
      const client = getSupabase();
      
      // Get user role for validation
      const { data: user } = await client
        .from('users')
        .select('role')
        .eq('id', user_id)
        .single();

      // Rule for Teachers and Leaders - All Resources
      if (user && (user.role === 'teacher' || user.role === 'leader')) {
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

        if (reservation_date < todayStr) {
          return res.status(400).json({ error: 'Não é possível realizar reservas para datas passadas.' });
        }

        if (reservation_date > tomorrowStr) {
          return res.status(400).json({ error: 'Professores só podem realizar reservas para o dia atual ou para o dia seguinte.' });
        }

        if (reservation_date === tomorrowStr && now.getHours() < 18) {
          return res.status(400).json({ error: 'Reservas para o dia seguinte só são permitidas a partir das 18h de hoje.' });
        }
      }

      // Conflict Validation for multiple slots
      // We fetch all reservations for this resource and date
      const { data: existingReservations, error: fetchError } = await client
        .from('reservations')
        .select('start_time')
        .eq('resource_id', resource_id)
        .eq('reservation_date', reservation_date)
        .eq('status', 'reserved');

      if (fetchError) return res.status(500).json({ error: fetchError.message });

      const newSlots = start_time.split(',');
      
      if (existingReservations) {
        for (const resv of existingReservations) {
          const existingSlots = resv.start_time.split(',');
          const conflict = newSlots.find(slot => existingSlots.includes(slot));
          if (conflict) {
            return res.status(400).json({ error: `O ${conflict}º horário já está reservado por outro professor.` });
          }
        }
      }

      // Insert single record with all slots
      const { data, error } = await client
        .from('reservations')
        .insert([{
          resource_id,
          user_id,
          responsible_name,
          group_or_sector,
          reservation_date,
          start_time, // String with comma-separated slot numbers (e.g. "1,2,7")
          end_time: start_time, // Keeping end_time in sync for legacy compatibility
          observation
        }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      res.json({ id: data[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/reservations/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      const { error } = await getSupabase()
        .from('reservations')
        .update({ status })
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/reservations/:id', async (req, res) => {
    const { userId, role } = req.query;
    
    try {
      const client = getSupabase();
      if (role === 'admin') {
        const { error } = await client.from('reservations').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      const { data: reservation } = await client
        .from('reservations')
        .select('user_id')
        .eq('id', req.params.id)
        .single();

      if (reservation && String(reservation.user_id) === String(userId)) {
        const { error } = await client.from('reservations').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      res.status(403).json({ error: 'Você não tem permissão para excluir esta reserva.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Extraclasse
  app.get('/api/extraclasse', async (req, res) => {
    try {
      const { data: records, error } = await getSupabase()
        .from('extraclasse')
        .select(`
          *,
          user:users(name)
        `)
        .order('activity_date', { ascending: false });
      
      if (error) return res.status(500).json({ error: error.message });
      
      const flattened = (records || []).map(r => ({
        ...r,
        user_name: (r.user as any)?.name
      }));
      
      res.json(flattened);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/extraclasse', async (req, res) => {
    const { user_id, student_name, class_name, requesting_teacher, activity_date, time_slots, reason, observation } = req.body;
    try {
      const { data, error } = await getSupabase()
        .from('extraclasse')
        .insert([{
          user_id,
          student_name,
          class_name,
          requesting_teacher,
          activity_date,
          time_slots,
          reason,
          observation,
          status: 'pending'
        }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      res.json({ id: data[0].id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/extraclasse/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
      const { error } = await getSupabase()
        .from('extraclasse')
        .update({ status })
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/extraclasse/:id', async (req, res) => {
    try {
      const { error } = await getSupabase()
        .from('extraclasse')
        .delete()
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Daily Attendance
  app.get('/api/attendance', async (req, res) => {
    const { date } = req.query;
    const targetDate = (date as string) || format(new Date(), 'yyyy-MM-dd');
    
    try {
      const { data: records, error } = await getSupabase()
        .from('daily_attendance')
        .select(`
          *,
          user:users(name)
        `)
        .eq('attendance_date', targetDate)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message?.includes('daily_attendance') && error.message?.includes('not found')) {
          return res.status(500).json({ 
            error: 'A tabela "daily_attendance" não foi encontrada. Por favor, execute o script SQL de migração no painel do Supabase.',
            migrationRequired: true
          });
        }
        return res.status(500).json({ error: error.message });
      }
      
      const flattened = (records || []).map(r => ({
        ...r,
        responsible_name: (r.user as any)?.name
      }));
      
      res.json(flattened);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/attendance', async (req, res) => {
    const { user_id, class_name, student_count, attendance_date } = req.body;
    
    if (!class_name || student_count === undefined || student_count < 0) {
      return res.status(400).json({ error: 'Dados inválidos. Verifique sala e quantidade.' });
    }

    try {
      const { data, error } = await getSupabase()
        .from('daily_attendance')
        .upsert({
          user_id,
          class_name,
          student_count: parseInt(student_count),
          attendance_date
        }, {
          onConflict: 'class_name,attendance_date'
        })
        .select();

      if (error) {
        if (error.message?.includes('daily_attendance') && error.message?.includes('not found')) {
          return res.status(500).json({ error: 'A tabela "daily_attendance" não foi encontrada. Por favor, execute o script SQL de migração no painel do Supabase.' });
        }
        return res.status(500).json({ error: error.message });
      }
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/attendance/:id', async (req, res) => {
    try {
      const { error } = await getSupabase()
        .from('daily_attendance')
        .delete()
        .eq('id', req.params.id);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/attendance/:id', async (req, res) => {
    const { class_name, student_count } = req.body;
    try {
      const { data, error } = await getSupabase()
        .from('daily_attendance')
        .update({
          class_name,
          student_count: parseInt(student_count),
        })
        .eq('id', req.params.id)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', async (req, res) => {
    const { date } = req.query;
    const targetDate = (date as string) || format(new Date(), 'yyyy-MM-dd');
    
    try {
      const client = getSupabase();
      const { data: resources, error: resError } = await client.from('resources').select('type');
      if (resError) throw resError;

      const labsCount = resources.filter(r => r.type.toLowerCase().includes('laborat')).length;
      const equipCount = resources.filter(r => 
        r.type.toLowerCase().includes('equipamento') || 
        r.type.toLowerCase().includes('material') ||
        r.type.toLowerCase().includes('projetor')
      ).length;

      const { count, error: countError } = await client
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('reservation_date', targetDate)
        .eq('status', 'reserved');

      if (countError) {
        console.error('Reservations count error:', countError);
      }

      let totalPresence = 0;
      try {
        const { data: attendanceData, error: attError } = await client
          .from('daily_attendance')
          .select('student_count')
          .eq('attendance_date', targetDate);

        if (attError) {
          console.warn('Attendance query error (maybe table not created yet):', attError.message);
        } else {
          totalPresence = (attendanceData || []).reduce((sum, curr) => sum + curr.student_count, 0);
        }
      } catch (attErr) {
        console.warn('Attendance fetch failed:', attErr);
      }

      res.json({
        total: count || 0,
        labs: labsCount,
        equip: equipCount,
        presence: totalPresence
      });
    } catch (error: any) {
      console.error('Dashboard Stats Fatal Error:', error);
      res.status(500).json({ 
        total: 0, 
        labs: 0, 
        equip: 0, 
        presence: 0,
        error: error.message || 'Internal server error' 
      });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    import('fs').then(fs => {
      if (fs.existsSync(indexPath)) {
        console.log('Production mode: dist/index.html found at', indexPath);
      } else {
        console.error('Production mode Error: dist/index.html NOT FOUND at', indexPath);
        console.log('Current directory contents:', fs.readdirSync(process.cwd()));
      }
    });

    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('SERVER FATAL ERROR DURING STARTUP:', err);
  process.exit(1);
});
