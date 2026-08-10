const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const rpcEndpoints = [
  'exec_sql',
  'execute_sql',
  'run_sql',
  'sql',
  'query',
  'create_table',
  'add_column'
];

async function testRPCs() {
  console.log('====================================================');
  console.log('🔍 PROBING RPC ENDPOINTS FOR SQL DDL EXECUTION');
  console.log('====================================================\n');

  for (const rpc of rpcEndpoints) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: 'SELECT 1;' })
    });

    const body = await res.text();
    console.log(`RPC '${rpc}': Status ${res.status} -> ${body}`);
  }

  console.log('\n====================================================');
}

testRPCs();
