const express = require('express');
const router = express.Router();
const sentencesController = require('../controllers/sentences.controller');

/**
 * Sentence Routes:
 * GET /api/sentences        - Get all sentences (supports ?level=A1&topic=...)
 * GET /api/sentences/topics - Get distinct available topics
 * GET /api/sentences/:id    - Get sentence by id
 */
router.get('/', (req, res) => sentencesController.getAllSentences(req, res));
router.get('/topics', (req, res) => sentencesController.getTopics(req, res));
router.get('/:id', (req, res) => sentencesController.getSentenceById(req, res));

module.exports = router;
