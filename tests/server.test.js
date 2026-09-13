const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
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
    assert.strictEqual(sentences[0].text_en, "Hello");
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
    const topicRes = await get('/api/sentences?topic=daily-life');
    assert.strictEqual(topicRes.status, 200);
    const dailyLifeSentences = JSON.parse(topicRes.body);
    assert.ok(dailyLifeSentences.length > 0);
    assert.ok(dailyLifeSentences.every(s => s.topic === 'daily-life'));
    console.log(`✓ GET /api/sentences?topic=daily-life passed (${dailyLifeSentences.length} sentences)`);

    // 5. Topics list API
    const topicsListRes = await get('/api/sentences/topics');
    assert.strictEqual(topicsListRes.status, 200);
    const topics = JSON.parse(topicsListRes.body);
    assert.ok(Array.isArray(topics));
    const topicIds = topics.map(t => t.id);
    const EXPECTED_TOPICS = ['greetings', 'daily-life', 'work-study', 'shopping-food', 'travel', 'feelings-opinions', 'health', 'technology', 'plans-conversations', 'general'];
    EXPECTED_TOPICS.forEach(t => assert.ok(topicIds.includes(t), `Expected topic "${t}" in topics list`));
    // 500-sentence curriculum: 10 topics total (5 A1 + 5 A2)
    assert.strictEqual(topics.length, 10, `Expected 10 topics, got ${topics.length}`);
    console.log(`✓ GET /api/sentences/topics passed (${topics.length} topics)`);

    // 5a. Topics filtered by level
    const topicsA1Res = await get('/api/sentences/topics?level=A1');
    assert.strictEqual(topicsA1Res.status, 200);
    const topicsA1 = JSON.parse(topicsA1Res.body);
    assert.strictEqual(topicsA1.length, 5, 'A1 should have exactly 5 topics');
    const a1Ids = topicsA1.map(t => t.id);
    assert.ok(!a1Ids.includes('technology'), 'A1 topics should not include technology');
    assert.ok(!a1Ids.includes('feelings-opinions'), 'A1 topics should not include feelings-opinions');
    console.log(`✓ GET /api/sentences/topics?level=A1 passed (${topicsA1.length} topics)`);

    const topicsA2Res = await get('/api/sentences/topics?level=A2');
    assert.strictEqual(topicsA2Res.status, 200);
    const topicsA2 = JSON.parse(topicsA2Res.body);
    assert.strictEqual(topicsA2.length, 5, 'A2 should have 5 topics');
    const a2Ids = topicsA2.map(t => t.id);
    assert.ok(a2Ids.includes('technology'), 'A2 topics should include technology');
    assert.ok(a2Ids.includes('feelings-opinions'), 'A2 topics should include feelings-opinions');
    console.log(`✓ GET /api/sentences/topics?level=A2 passed (${topicsA2.length} topics)`);

    // 6. Level-filtered sentences
    const sentencesA1Res = await get('/api/sentences?level=A1');
    assert.strictEqual(sentencesA1Res.status, 200);
    const sentencesA1 = JSON.parse(sentencesA1Res.body);
    assert.ok(sentencesA1.length >= 100, `Expected many A1 sentences, got ${sentencesA1.length}`);
    assert.ok(sentencesA1.every(s => s.level === 'A1'), 'All returned sentences should be A1');
    console.log(`✓ GET /api/sentences?level=A1 passed (${sentencesA1.length} sentences)`);

    const sentencesA2Res = await get('/api/sentences?level=A2');
    assert.strictEqual(sentencesA2Res.status, 200);
    const sentencesA2 = JSON.parse(sentencesA2Res.body);
    assert.ok(sentencesA2.length >= 100, `Expected many A2 sentences, got ${sentencesA2.length}`);
    assert.ok(sentencesA2.every(s => s.level === 'A2'), 'All returned sentences should be A2');
    assert.ok(sentencesA2.some(s => s.topic === 'technology'), 'A2 should include technology topic');
    assert.ok(sentencesA2.some(s => s.topic === 'feelings-opinions'), 'A2 should include feelings-opinions topic');
    console.log(`✓ GET /api/sentences?level=A2 passed (${sentencesA2.length} sentences)`);

    // 7. Level + topic combined filter
    const combinedRes = await get('/api/sentences?level=A2&topic=technology');
    assert.strictEqual(combinedRes.status, 200);
    const combined = JSON.parse(combinedRes.body);
    assert.ok(combined.length > 0, 'Should have A2 technology sentences');
    assert.ok(combined.every(s => s.level === 'A2' && s.topic === 'technology'));
    console.log(`✓ GET /api/sentences?level=A2&topic=technology passed (${combined.length} sentences)`);

    // 8. Static Client index.html
    const indexRes = await get('/');
    assert.strictEqual(indexRes.status, 200);
    assert.ok(indexRes.body.includes('SayType'));
    assert.ok(indexRes.body.includes('styles/tokens.css'));
    assert.ok(indexRes.body.includes('styles/pages.css'));
    assert.ok(indexRes.body.includes('js/app.js'));
    assert.ok(indexRes.body.includes('desktop-nav'));
    assert.ok(indexRes.body.includes('mobile-nav'));
    assert.ok(indexRes.body.includes('page-home'));
    assert.ok(indexRes.body.includes('page-practice'));
    assert.ok(indexRes.body.includes('page-review'));
    console.log('✓ GET / (client index.html) passed');

    // 9. CSS files
    const tokensRes = await get('/styles/tokens.css');
    assert.strictEqual(tokensRes.status, 200);
    assert.ok(tokensRes.body.includes('--surface: #171b1f'));
    console.log('✓ GET /styles/tokens.css passed');

    const baseRes = await get('/styles/base.css');
    assert.strictEqual(baseRes.status, 200);
    assert.ok(baseRes.body.includes('.typing-anchor'));
    console.log('✓ GET /styles/base.css passed');

    const compRes = await get('/styles/components.css');
    assert.strictEqual(compRes.status, 200);
    assert.ok(compRes.body.includes('.sentence-vessel'));
    console.log('✓ GET /styles/components.css passed');

    const pagesRes = await get('/styles/pages.css');
    assert.strictEqual(pagesRes.status, 200);
    assert.ok(pagesRes.body.includes('.mobile-nav'));
    assert.ok(pagesRes.body.includes('.home-container'));
    console.log('✓ GET /styles/pages.css passed');

    // 10. JS files
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

    // 12. Content validation tests
    console.log('\n--- Content Validation ---');
    const a1Data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'sentences.a1.json'), 'utf8'));
    const a2Data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'sentences.a2.json'), 'utf8'));
    const allData = [...a1Data, ...a2Data];

    // Unique IDs
    const allIds = allData.map(s => s.id);
    const uniqueIds = new Set(allIds);
    assert.strictEqual(uniqueIds.size, allIds.length, `Duplicate IDs found: ${allIds.length - uniqueIds.size} duplicates`);
    console.log(`✓ Content: ${allIds.length} unique IDs (${a1Data.length} A1 + ${a2Data.length} A2)`);

    // Valid levels
    const invalidLevels = allData.filter(s => s.level !== 'A1' && s.level !== 'A2');
    assert.strictEqual(invalidLevels.length, 0, `Invalid levels: ${invalidLevels.map(s => s.id + ':' + s.level).join(', ')}`);
    console.log('✓ Content: all levels valid');

    // Valid topics
    const validTopics = ['greetings', 'daily-life', 'work-study', 'shopping-food', 'travel', 'feelings-opinions', 'health', 'technology', 'plans-conversations', 'general'];
    const invalidTopics = allData.filter(s => !validTopics.includes(s.topic));
    assert.strictEqual(invalidTopics.length, 0, `Invalid topics: ${[...new Set(invalidTopics.map(s => s.topic))].join(', ')}`);
    console.log('✓ Content: all topics valid');

    // Non-empty English
    const emptyEn = allData.filter(s => !s.text_en || s.text_en.trim().length === 0);
    assert.strictEqual(emptyEn.length, 0, `Empty English: ${emptyEn.map(s => s.id).join(', ')}`);
    console.log('✓ Content: all English sentences non-empty');

    // Non-empty Arabic
    const emptyAr = allData.filter(s => !s.text_ar || s.text_ar.trim().length === 0);
    assert.strictEqual(emptyAr.length, 0, `Empty Arabic: ${emptyAr.map(s => s.id).join(', ')}`);
    console.log('✓ Content: all Arabic sentences non-empty');

    // No corrupted characters (Chinese/Japanese/Thai ranges)
    const corrupted = allData.filter(s => {
      const text = s.text_ar || '';
      return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0e00-\u0e7f]/.test(text);
    });
    assert.strictEqual(corrupted.length, 0, `Corrupted Arabic: ${corrupted.map(s => s.id + ':' + s.text_ar.substring(0, 20)).join(', ')}`);
    console.log('✓ Content: no corrupted characters in Arabic');

    // Valid words metadata
    const badWords = allData.filter(s => !Array.isArray(s.words) || s.words.length === 0);
    assert.strictEqual(badWords.length, 0, `Missing words: ${badWords.map(s => s.id).join(', ')}`);
    const incompleteWords = allData.filter(s => s.words.some(w => !w.word || !w.translation || !w.pronunciation || !w.partOfSpeech));
    assert.strictEqual(incompleteWords.length, 0, `Incomplete word metadata: ${incompleteWords.map(s => s.id).join(', ')}`);
    console.log('✓ Content: all word metadata complete');

    // Duplicate English sentences
    const enSentences = allData.map(s => s.text_en);
    const dupEn = enSentences.filter((s, i) => enSentences.indexOf(s) !== i);
    assert.ok(dupEn.length <= 2, `Excessive duplicate English: ${[...new Set(dupEn)].join('; ')}`);
    console.log('✓ Content: English sentences duplicate rate within curriculum threshold');

    // 13. Multi-file loading (using temp test data directory)
    const tmpDir = path.join(__dirname, '.tmp-test-data');
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'sentences.alpha.json'), JSON.stringify([
        { id: 'test-alpha-001', level: 'A1', topic: 'test', topic_label: 'Test', text_en: 'Alpha sentence.', text_ar: 'جملة ألف.', english: 'Alpha sentence.', arabic: 'جملة ألف.', words: [], tags: [] }
      ]));
      fs.writeFileSync(path.join(tmpDir, 'sentences.beta.json'), JSON.stringify([
        { id: 'test-beta-001', level: 'A2', topic: 'test', topic_label: 'Test', text_en: 'Beta sentence.', text_ar: 'جملة بيتا.', english: 'Beta sentence.', arabic: 'جملة بيتا.', words: [], tags: [] }
      ]));
      // Also write a non-matching file to ensure it's ignored
      fs.writeFileSync(path.join(tmpDir, 'sentences.readme.txt'), 'This should be ignored.');
      fs.writeFileSync(path.join(tmpDir, 'other.json'), JSON.stringify([{ id: 'should-not-load' }]));

      const { SentencesRepository } = require('../server/repositories/sentences.repository');
      const testRepo = new SentencesRepository(tmpDir);
      const loaded = await testRepo.findAll();
      assert.strictEqual(loaded.length, 2, 'Should load exactly 2 sentences from 2 matching files');
      const ids = loaded.map(s => s.id).sort();
      assert.deepStrictEqual(ids, ['test-alpha-001', 'test-beta-001']);

      // Level-aware getTopics on the test repo
      const testTopicsA1 = await testRepo.getTopics('A1');
      assert.strictEqual(testTopicsA1.length, 1);
      assert.strictEqual(testTopicsA1[0].count, 1);
      const testTopicsAll = await testRepo.getTopics();
      assert.strictEqual(testTopicsAll.length, 1);
      assert.strictEqual(testTopicsAll[0].count, 2);
      console.log('✓ Multi-file loading + level-aware getTopics passed');
    } finally {
      // Clean up temp directory
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    console.log('\nALL SERVER TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
