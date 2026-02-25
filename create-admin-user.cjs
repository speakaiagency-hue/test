// Script para criar usuário admin
// Execute: node create-admin-user.js

const bcrypt = require('bcrypt');

async function generateAdminPassword() {
  const password = 'admin123'; // Mude aqui se quiser outra senha
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=== CRIAR USUÁRIO ADMIN ===\n');
  console.log('Execute este SQL no console do Neon:\n');
  console.log(`-- Criar usuário admin
INSERT INTO users (id, username, password, email, name, status, is_admin)
VALUES (
  gen_random_uuid(),
  'admin@speakai.com',
  '${hash}',
  'admin@speakai.com',
  'Administrador',
  'active',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Adicionar créditos
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

-- Verificar
SELECT id, username, email, name, is_admin FROM users WHERE username = 'admin@speakai.com';
`);
  
  console.log('\n=== CREDENCIAIS DE LOGIN ===');
  console.log('Email: admin@speakai.com');
  console.log('Senha: admin123');
  console.log('\n');
}

generateAdminPassword().catch(console.error);
