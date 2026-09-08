import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  console.log('=== SUPABASE POSTGRESQL LIVE VERIFICATION ===');

  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('Users in DB count:', users ? users.length : 0);
  if (users) {
    users.forEach((u) => console.log(`  - [User] ${u.email} (ID: ${u.id})`));
  }

  const { data: keys, error: kErr } = await supabase
    .from('api_keys')
    .select('id, name, prefix, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('API Keys in DB count:', keys ? keys.length : 0);
  if (keys) {
    keys.forEach((k) => console.log(`  - [Key] ${k.name} (${k.prefix}) Active: ${k.is_active}`));
  }

  const { data: logs, error: lErr } = await supabase
    .from('request_logs')
    .select('id, model, cache_hit, pii_scrubbed_count, latency_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Request Logs in DB count:', logs ? logs.length : 0);
  if (logs) {
    logs.forEach((l) =>
      console.log(
        `  - [Log] Model: ${l.model} | Cache Hit: ${l.cache_hit} | PII Scrubbed: ${l.pii_scrubbed_count} | Latency: ${l.latency_ms}ms`
      )
    );
  }
}

checkDb().catch(console.error);
