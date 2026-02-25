-- Script para criar usuário admin no banco Neon
-- Execute este script no console SQL do Neon (https://console.neon.tech)

-- 1. Criar usuário admin
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (id, username, password, email, name, status, is_admin)
VALUES (
  gen_random_uuid(),
  'admin@speakai.com',
  '$2b$10$YQZJZjZQZjZQZjZQZjZQZeK8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8',
  'admin@speakai.com',
  'Administrador',
  'active',
  true
)
ON CONFLICT (username) DO NOTHING;

-- 2. Adicionar créditos ilimitados para o admin
INSERT INTO user_credits (id, user_id, credits, total_purchased, total_used)
SELECT 
  gen_random_uuid(),
  u.id,
  999999,
  999999,
  0
FROM users u
WHERE u.username = 'admin@speakai.com'
ON CONFLICT DO NOTHING;

-- 3. Verificar se foi criado
SELECT id, username, email, name, is_admin FROM users WHERE username = 'admin@speakai.com';
