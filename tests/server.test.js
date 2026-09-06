const assert = require('assert');
const http = require('http');
const app = require('../server/app');

const server = app.listen(3002, async () => {
  console.log('Testing server on port 3002...');
  
  function get(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:3002${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });
  }

  try {
    // 1. Health check
    const health = await get('/api/health');
    assert.strictEqual(health.status, 200);
    const healthJson = JSON.parse(health.body);
    assert.strictEqual(healthJson.status, 'ok');
    console.log('✓ Health check passed');

    // 2. Sentences API
    const sentencesRes = await get('/api/sentences');
    assert.strictEqual(sentencesRes.status, 200);
    const sentences = JSON.parse(sentencesRes.body);
    assert.strictEqual(Array.isArray(sentences), true);
    assert.ok(sentences.length >= 10, `Expected at least 10 sentences, got ${sentences.length}`);
    assert.strictEqual(sentences[0].text_en, "I wake up at seven every morning.");
    assert.strictEqual(sentences[0].level, "A1");
    assert.ok(Array.isArray(sentences[0].words) && sentences[0].words.length > 0, 'Expected word-level metadata');
    console.log(`✓ GET /api/sentences passed (${sentences.length} sentences)`);

    // 3. Single sentence API (string IDs like a1-daily-life-001)
    const firstId = sentences[0].id;
    const singleRes = await get(`/api/sentences/${firstId}`);
    assert.strictEqual(singleRes.status, 200);
    const single = JSON.parse(singleRes.body);
    assert.strictEqual(single.id, firstId);
    console.log(`✓ GET /api/sentences/${firstId} passed`);

    // 4. Topic filtering API
    const topicRes = await get('/api/sentences?topic=food');
    assert.strictEqual(topicRes.status, 200);
    const foodSentences = JSON.parse(topicRes.body);
    assert.ok(foodSentences.length > 0);
    assert.ok(foodSentences.every(s => s.topic === 'food'));
    console.log(`✓ GET /api/sentences?topic=food passed (${foodSentences.length} sentences)`);

    // 5. Topics list API
    const topicsListRes = await get('/api/sentences/topics');
    assert.strictEqual(topicsListRes.status, 200);
    const topics = JSON.parse(topicsListRes.body);
    assert.ok(Array.isArray(topics));
    const topicIds = topics.map(t => t.id);
    const EXPECTED_TOPICS = ['daily-life', 'family', 'food', 'travel', 'university', 'work', 'shopping', 'health', 'weather', 'communication'];
    EXPECTED_TOPICS.forEach(t => assert.ok(topicIds.includes(t), `Expected topic "${t}" in topics list`));
    assert.strictEqual(topics.length, EXPECTED_TOPICS.length, 'Expected exactly 10 topics');
    console.log(`✓ GET /api/sentences/topics passed (${topics.length} topics)`);

    // 6. Static Client index.html
    const indexRes = await get('/');
    assert.strictEqual(indexRes.status, 200);
    assert.ok(indexRes.body.includes('SayType'));
    assert.ok(indexRes.body.includes('styles/tokens.css'));
    assert.ok(indexRes.body.includes('js/app.js'));
    console.log('✓ GET / (client index.html) passed');

    // 7. CSS files
    const tokensRes = await get('/styles/tokens.css');
    assert.strictEqual(tokensRes.status, 200);
    assert.ok(tokensRes.body.includes('--surface: #0f1114'));
    console.log('✓ GET /styles/tokens.css passed');

    const baseRes = await get('/styles/base.css');
    assert.strictEqual(baseRes.status, 200);
    assert.ok(baseRes.body.includes('.typing-anchor'));
    console.log('✓ GET /styles/base.css passed');

    const compRes = await get('/styles/components.css');
    assert.strictEqual(compRes.status, 200);
    assert.ok(compRes.body.includes('.sentence-vessel'));
    console.log('✓ GET /styles/components.css passed');

    // 8. JS files
    const jsRes = await get('/js/app.js');
    assert.strictEqual(jsRes.status, 200);
    assert.ok(jsRes.body.includes('bootstrap'));
    console.log('✓ GET /js/app.js passed');

    // 9. Config endpoint (public Supabase config)
    const configRes = await get('/api/config');
    assert.strictEqual(configRes.status, 200);
    const configJson = JSON.parse(configRes.body);
    assert.strictEqual(typeof configJson.supabaseUrl, 'string');
    assert.strictEqual(typeof configJson.supabaseAnonKey, 'string');
    console.log('✓ GET /api/config passed');

    console.log('\nALL SERVER TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
