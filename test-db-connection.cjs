// Teste de conexão com o banco
const { Pool } = require('pg');

async function testConnection() {
  const connectionString = 'postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
  
  console.log('\n=== TESTE DE CONEXÃO COM NEON ===\n');
  console.log('Connection String:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('\n🔄 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testar query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query executada:', result.rows[0]);
    
    // Buscar usuário
    const userResult = await client.query(
      "SELECT id, username, email, name, LENGTH(password) as pwd_len FROM users WHERE username = 'admin@speakai.com'"
    );
    
    if (userResult.rows.length > 0) {
      console.log('\n✅ Usuário encontrado:', userResult.rows[0]);
    } else {
      console.log('\n❌ Usuário não encontrado no banco!');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Erro de conexão:', error.message);
    console.error('Código do erro:', error.code);
    await pool.end();
  }
}

testConnection();
