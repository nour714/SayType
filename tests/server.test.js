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
    assert.strictEqual(sentences.length, 10);
    assert.strictEqual(sentences[0].text_en, "I am tired.");
    console.log('✓ GET /api/sentences passed (10 sentences)');

    // 3. Single sentence API
    const singleRes = await get('/api/sentences/1');
    assert.strictEqual(singleRes.status, 200);
    const single = JSON.parse(singleRes.body);
    assert.strictEqual(single.id, 1);
    console.log('✓ GET /api/sentences/1 passed');

    // 4. Static Client index.html
    const indexRes = await get('/');
    assert.strictEqual(indexRes.status, 200);
    assert.ok(indexRes.body.includes('SayType'));
    assert.ok(indexRes.body.includes('styles/tokens.css'));
    assert.ok(indexRes.body.includes('js/app.js'));
    console.log('✓ GET / (client index.html) passed');

    // 5. CSS files
    const tokensRes = await get('/styles/tokens.css');
    assert.strictEqual(tokensRes.status, 200);
    assert.ok(tokensRes.body.includes('--surface: #141312'));
    console.log('✓ GET /styles/tokens.css passed');

    const baseRes = await get('/styles/base.css');
    assert.strictEqual(baseRes.status, 200);
    assert.ok(baseRes.body.includes('.typing-anchor'));
    console.log('✓ GET /styles/base.css passed');

    const compRes = await get('/styles/components.css');
    assert.strictEqual(compRes.status, 200);
    assert.ok(compRes.body.includes('.sentence-vessel'));
    console.log('✓ GET /styles/components.css passed');

    // 6. JS files
    const jsRes = await get('/js/app.js');
    assert.strictEqual(jsRes.status, 200);
    assert.ok(jsRes.body.includes('bootstrap'));
    console.log('✓ GET /js/app.js passed');

    console.log('\nALL SERVER TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
