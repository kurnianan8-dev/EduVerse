const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function auditDatabaseSchema() {
  console.log('====================================================');
  console.log('🔍 AUDITING SUPABASE DATABASE SCHEMA & DATA (PURE FETCH)');
  console.log('====================================================\n');

  // 1. OpenAPI Definition
  try {
    const openapiRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (openapiRes.ok) {
      const openapi = await openapiRes.json();
      console.log('--- 📋 POSTGREST OPENAPI SCHEMA DEFINITIONS ---');
      const tableNames = Object.keys(openapi.definitions || {});
      console.log('Available Tables:', tableNames);

      if (openapi.definitions?.classes) {
        console.log('\n--- 🏫 "classes" Table Columns ---');
        console.log(Object.keys(openapi.definitions.classes.properties || {}));
      } else {
        console.log('\n⚠️ "classes" table NOT in OpenAPI definitions!');
      }

      if (openapi.definitions?.enrollments) {
        console.log('\n--- 🎓 "enrollments" Table Columns ---');
        console.log(Object.keys(openapi.definitions.enrollments.properties || {}));
      } else {
        console.log('\n⚠️ "enrollments" table NOT in OpenAPI definitions!');
      }
    } else {
      console.log('OpenAPI fetch status:', openapiRes.status, await openapiRes.text());
    }
  } catch (err) {
    console.error('OpenAPI fetch error:', err.message);
  }

  // 2. Fetch rows from `classes`
  console.log('\n--- 🔍 FETCHING "classes" ROWS ---');
  try {
    const clsRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log('classes fetch HTTP status:', clsRes.status);
    const clsRows = await clsRes.json();
    console.log('classes count:', clsRows?.length);
    console.log('classes data sample:', JSON.stringify(clsRows, null, 2));
  } catch (err) {
    console.error('classes fetch err:', err.message);
  }

  // 3. Fetch rows from `enrollments`
  console.log('\n--- 🔍 FETCHING "enrollments" ROWS ---');
  try {
    const enrRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log('enrollments fetch HTTP status:', enrRes.status);
    const enrRows = await enrRes.json();
    console.log('enrollments count:', enrRows?.length);
    console.log('enrollments data sample:', JSON.stringify(enrRows, null, 2));
  } catch (err) {
    console.error('enrollments fetch err:', err.message);
  }

  console.log('\n====================================================');
}

auditDatabaseSchema();
