/**
 * load-test.js — Tim Collins Framework load test
 *
 * Tests 3 layers under 100 concurrent virtual users:
 *   1. Page/CDN layer   → Vercel edge (marketing, login, faq)
 *   2. Supabase REST    → anonymous reads (health, DB connection exercise)
 *   3. Auth round-trip  → sign-in + read with user token (if TEST_EMAIL set)
 *
 * INSTALL k6 on Windows (run once as admin):
 *   winget install k6 --source winget
 *   OR download: https://github.com/grafana/k6/releases/latest → k6-vX.X.X-windows-amd64.zip
 *
 * RUN (public test only):
 *   k6 run load-test.js
 *
 * RUN (with auth flow - provide a real test account):
 *   $env:TEST_EMAIL="test@example.com"; $env:TEST_PASSWORD="password"; k6 run load-test.js
 *
 * Results saved to: load-test-results.json
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const errorRate      = new Rate('error_rate');
const pageLoadTime   = new Trend('page_load_ms',     true);
const supabaseReadMs = new Trend('supabase_read_ms', true);
const authLatencyMs  = new Trend('auth_latency_ms',  true);
const failedReqs     = new Counter('failed_requests');

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL     = 'https://timcollinsframework.com';
const SUPABASE_URL = 'https://ozkeusokwhdtdrshtdmc.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a2V1c29rd2hkdGRyc2h0ZG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTIwNzMsImV4cCI6MjA4NDU4ODA3M30.ZTkEatmgmbhVFHmBz0hNA0VlBl1sYjm73hJuwoItkFM';

const TEST_EMAIL    = __ENV.TEST_EMAIL    || '';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || '';

// ─── Load shape: ramp → hold → ramp down ─────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50  },  // warm up to 50 VUs
    { duration: '15s', target: 100 },  // ramp to 100 VUs
    { duration: '60s', target: 100 },  // hold at 100 for 1 minute
    { duration: '15s', target: 0   },  // ramp down
  ],
  thresholds: {
    'page_load_ms':     ['p(95)<3000'],  // 95% of pages < 3s
    'supabase_read_ms': ['p(95)<1000'],  // 95% of DB reads < 1s
    'error_rate':       ['rate<0.05'],   // < 5% error rate
    'http_req_duration':['p(95)<4000'],  // overall request p95 < 4s
  },
};

// ─── Shared headers ───────────────────────────────────────────────────────────
const sbHeaders = {
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type':  'application/json',
  'Accept':        'application/json',
};

// ─── Layer 1: Vercel / CDN pages ─────────────────────────────────────────────
function testPageLayer() {
  group('1. Page / CDN Layer', () => {
    const pages = [
      { name: 'home',  url: `${BASE_URL}/`       },
      { name: 'login', url: `${BASE_URL}/login`   },
      { name: 'faq',   url: `${BASE_URL}/faq`     },
    ];

    for (const page of pages) {
      const start = Date.now();
      const res   = http.get(page.url, { tags: { name: page.name } });
      const ms    = Date.now() - start;
      pageLoadTime.add(ms);

      const ok = check(res, {
        [`${page.name}: status 200`]: r => r.status === 200,
        [`${page.name}: < 3s`]:       () => ms < 3000,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);

      sleep(0.4);
    }
  });
}

// ─── Layer 2: Supabase DB / auth health ──────────────────────────────────────
function testSupabaseLayer() {
  group('2. Supabase REST Layer', () => {
    // Auth server health
    {
      const start = Date.now();
      const res   = http.get(`${SUPABASE_URL}/auth/v1/health`, {
        headers: sbHeaders,
        tags: { name: 'sb_auth_health' },
      });
      const ms = Date.now() - start;
      supabaseReadMs.add(ms);
      const ok = check(res, {
        'auth health 200': r => r.status === 200,
        'auth health <1s': () => ms < 1000,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);
    }
    sleep(0.3);

    // DB connection: hit the profiles table (anon key, RLS blocks data but DB must respond)
    {
      const start = Date.now();
      const res   = http.get(
        `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
        { headers: sbHeaders, tags: { name: 'sb_profiles_ping' } }
      );
      const ms = Date.now() - start;
      supabaseReadMs.add(ms);
      // 200 = anon allowed, 401/403 = RLS working correctly — both mean DB responded
      const ok = check(res, {
        'profiles db responds': r => [200, 401, 403, 406].includes(r.status),
        'profiles db <1.5s':    () => ms < 1500,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);
    }
    sleep(0.3);

    // Second auth health ping — confirms GoTrue stays healthy under sustained load
    {
      const start = Date.now();
      const res   = http.get(`${SUPABASE_URL}/auth/v1/health`, {
        headers: sbHeaders,
        tags: { name: 'sb_auth_health_2' },
      });
      const ms = Date.now() - start;
      supabaseReadMs.add(ms);
      const ok = check(res, {
        'auth health 2 ok':  r => r.status === 200,
        'auth health 2 <1s': () => ms < 1000,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);
    }
  });
}

// ─── Layer 3: Authenticated read (optional) ──────────────────────────────────
function testAuthLayer(email, password) {
  group('3. Auth + Read Layer', () => {
    // Sign in
    const start  = Date.now();
    const signinRes = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({ email, password }),
      { headers: sbHeaders, tags: { name: 'sb_signin' } }
    );
    const loginMs = Date.now() - start;
    authLatencyMs.add(loginMs);

    const signinOk = check(signinRes, {
      'signin 200':       r => r.status === 200,
      'signin has token': r => {
        try { return !!JSON.parse(r.body).access_token; } catch { return false; }
      },
      'signin <3s':       () => loginMs < 3000,
    });
    errorRate.add(signinOk ? 0 : 1);
    if (!signinOk) { failedReqs.add(1); return; }

    let token;
    try { token = JSON.parse(signinRes.body).access_token; } catch { return; }
    sleep(0.5);

    const authHeaders = { ...sbHeaders, 'Authorization': `Bearer ${token}` };

    // Read goals with auth
    {
      const t   = Date.now();
      const res = http.get(
        `${SUPABASE_URL}/rest/v1/goals?select=id,title,status&limit=10`,
        { headers: authHeaders, tags: { name: 'sb_auth_goals' } }
      );
      const ms = Date.now() - t;
      supabaseReadMs.add(ms);
      const ok = check(res, {
        'auth goals 200': r => r.status === 200,
        'auth goals <1s': () => ms < 1000,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);
    }
    sleep(0.3);

    // Read activities with auth
    {
      const t   = Date.now();
      const res = http.get(
        `${SUPABASE_URL}/rest/v1/activities?select=id,title,completed&limit=10`,
        { headers: authHeaders, tags: { name: 'sb_auth_activities' } }
      );
      const ms = Date.now() - t;
      supabaseReadMs.add(ms);
      const ok = check(res, {
        'auth activities 200': r => r.status === 200,
        'auth activities <1s': () => ms < 1000,
      });
      errorRate.add(ok ? 0 : 1);
      if (!ok) failedReqs.add(1);
    }
  });
}

// ─── Main VU loop ────────────────────────────────────────────────────────────
export default function () {
  testPageLayer();
  sleep(1);

  testSupabaseLayer();
  sleep(1);

  if (TEST_EMAIL && TEST_PASSWORD) {
    testAuthLayer(TEST_EMAIL, TEST_PASSWORD);
    sleep(1);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  function fmt(metric, key) {
    const v = data.metrics[metric]?.values?.[key];
    return v != null ? `${Math.round(v)}ms` : 'N/A';
  }
  function pass(metric, threshold, key = 'p(95)') {
    const v = data.metrics[metric]?.values?.[key];
    if (v == null) return '⬜ N/A '; // not tested
    return v < threshold ? '✅ PASS' : '❌ FAIL';
  }
  function passRate(metric, threshold, key = 'rate') {
    const v = data.metrics[metric]?.values?.[key];
    if (v == null) return '⬜ N/A ';
    return v < threshold ? '✅ PASS' : '❌ FAIL';
  }

  const totalReqs   = data.metrics['http_reqs']?.values?.count ?? 0;
  const failedCount = data.metrics['failed_requests']?.values?.count ?? 0;
  const errRate     = ((data.metrics['error_rate']?.values?.rate ?? 0) * 100).toFixed(2);

  const summary = [
    '',
    '══════════════════════════════════════════════════════════════',
    '  Tim Collins Framework — 100 VU Load Test Results',
    '══════════════════════════════════════════════════════════════',
    '',
    `  Total requests: ${totalReqs}  |  Failed: ${failedCount}  |  Error rate: ${errRate}%`,
    '',
    '  ┌──────────────────────────────────────────────────────────┐',
    '  │  Layer              │ Median   │ p95      │ Status     │',
    '  ├─────────────────────┼──────────┼──────────┼────────────┤',
    `  │ Page / CDN          │ ${fmt('page_load_ms','med').padEnd(8)} │ ${fmt('page_load_ms','p(95)').padEnd(8)} │ ${pass('page_load_ms',3000)}  │`,
    `  │ Supabase DB         │ ${fmt('supabase_read_ms','med').padEnd(8)} │ ${fmt('supabase_read_ms','p(95)').padEnd(8)} │ ${pass('supabase_read_ms',1000)}  │`,
    `  │ Auth (if tested)    │ ${fmt('auth_latency_ms','med').padEnd(8)} │ ${fmt('auth_latency_ms','p(95)').padEnd(8)} │ ${pass('auth_latency_ms',3000)}  │`,
    '  └──────────────────────────────────────────────────────────┘',
    '',
    `  HTTP 5xx errors:            ${(data.metrics['http_req_failed']?.values?.rate ?? 0) === 0 ? '✅ NONE' : '❌ ' + ((data.metrics['http_req_failed']?.values?.rate ?? 0)*100).toFixed(1)+'%'}`,
    `  Overall http_req p95 < 4s:  ${(data.metrics['http_req_duration']?.values?.['p(95)'] ?? 9999) < 4000 ? '✅ PASS' : '❌ FAIL'}`,
    `  k6 checks pass rate:        ${((1-(data.metrics['checks']?.values?.fails/(data.metrics['checks']?.values?.passes+data.metrics['checks']?.values?.fails||1)))*100).toFixed(1)}% passed`,
    '',
    '  Full JSON report: load-test-results.json',
    '══════════════════════════════════════════════════════════════',
    '',
  ].join('\n');

  console.log(summary);
  return {
    stdout: summary,
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
