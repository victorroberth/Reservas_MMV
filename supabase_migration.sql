-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responsible_name TEXT NOT NULL,
  group_or_sector TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  observation TEXT,
  status TEXT DEFAULT 'reserved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
INSERT INTO users (name, email, password, role) 
VALUES ('Administrador Master', 'admin.mmv@gmail.com', 'admin*MMV_123', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role) 
VALUES ('Professor João', 'joao@escola.com', 'senha123', 'teacher')
ON CONFLICT (email) DO NOTHING;

INSERT INTO resources (name, type, description) VALUES 
('Laboratório de Informática 1', 'Laboratório', 'Equipado com 30 computadores'),
('Projetor Epson X41', 'Equipamento', 'Branco, entrada HDMI'),
('Sala de Reuniões', 'Sala', 'Capacidade para 15 pessoas'),
('Caixa de Som JBL', 'Equipamento', 'Bluetooth e cabo P2');
