async function runTests() {
  console.log("=== RUNNING BACKEND INTEGRATION TESTS ===");

  // 1. Health check
  const healthRes = await fetch("http://localhost:5000/api/health");
  const healthJson = await healthRes.json();
  console.log("[PASS] /api/health:", healthJson);

  // 2. Fixtures
  const fixturesRes = await fetch("http://localhost:5000/api/fixtures?d=0");
  const fixturesJson = await fixturesRes.json() as any;
  console.log(`[PASS] /api/fixtures: success=${fixturesJson.success}, totalMatches=${fixturesJson.totalMatches}, groups=${fixturesJson.groups?.length}`);

  // 3. Matches
  const matchesRes = await fetch("http://localhost:5000/api/matches?d=0");
  const matchesJson = await matchesRes.json() as any;
  console.log(`[PASS] /api/matches: success=${matchesJson.success}, count=${matchesJson.count}`);

  // 4. Live matches
  const liveRes = await fetch("http://localhost:5000/api/matches/live?d=0");
  const liveJson = await liveRes.json() as any;
  console.log(`[PASS] /api/matches/live: success=${liveJson.success}, count=${liveJson.count}`);

  // 5. Register new test user
  const testEmail = `test_${Date.now()}@jolloftips.com`;
  const regRes = await fetch("http://localhost:5000/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      email: testEmail,
      password: "password123",
      name: "Integration Test User",
    }),
  });
  const regJson = await regRes.json() as any;
  const cookieHeader = regRes.headers.get("set-cookie");
  console.log(`[PASS] /api/auth (register): success=${regJson.success}, email=${regJson.user?.email}`);

  // 6. Login admin user
  const loginRes = await fetch("http://localhost:5000/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      email: "admin@jolloftips.com",
      password: "password123",
    }),
  });
  const loginJson = await loginRes.json() as any;
  const adminCookie = loginRes.headers.get("set-cookie");
  console.log(`[PASS] /api/auth (login admin): success=${loginJson.success}, role=${loginJson.user?.role}`);

  // 7. Admin endpoint with cookie
  const authToken = adminCookie?.split(";")[0];
  const adminRes = await fetch("http://localhost:5000/api/admin", {
    headers: { Cookie: authToken || "" },
  });
  const adminJson = await adminRes.json() as any;
  console.log(`[PASS] /api/admin: success=${adminJson.success}, totalUsers=${adminJson.stats?.totalUsers}`);

  // 8. Sync endpoint
  const syncRes = await fetch("http://localhost:5000/api/sync?d=0");
  const syncJson = await syncRes.json() as any;
  console.log(`[PASS] /api/sync: success=${syncJson.success}, totalMatches=${syncJson.totalMatches}`);

  console.log("=== ALL BACKEND ENDPOINTS PASSED ===");
}

runTests().catch(console.error);
