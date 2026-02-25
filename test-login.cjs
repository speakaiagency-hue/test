// Script para testar login
const bcrypt = require('bcrypt');

async function testLogin() {
  const email = 'admin@speakai.com';
  const password = 'admin123';
  const hashFromDB = '$2b$10$XHHOscR1YdJNZ.pl8/UqNOE/bkOn0EWUfWlrDsl.flhlmO8Esig.O';
  
  console.log('\n=== TESTE DE LOGIN ===\n');
  console.log('Email:', email);
  console.log('Senha:', password);
  console.log('Hash no banco:', hashFromDB);
  
  const match = await bcrypt.compare(password, hashFromDB);
  console.log('\n✅ Senha corresponde ao hash?', match);
  
  if (match) {
    console.log('\n🎉 O hash está correto! O problema pode ser:');
    console.log('1. O usuário não está sendo encontrado no banco');
    console.log('2. O campo password está vazio/null no banco');
    console.log('3. Há espaços extras no email ou senha');
    console.log('\nVerifique no Neon:');
    console.log('SELECT username, email, LENGTH(password) as password_length FROM users WHERE username = \'admin@speakai.com\';');
  } else {
    console.log('\n❌ Hash não corresponde! Precisa atualizar no banco.');
  }
}

testLogin().catch(console.error);
