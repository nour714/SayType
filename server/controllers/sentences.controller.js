const sentencesRepository = require('../repositories/sentences.repository');

/**
 * SentencesController — handles REST API request/response processing for sentences.
 */
class SentencesController {
  /**
   * GET /api/sentences
   * Optional query param: ?level=A1
   */
  async getAllSentences(req, res) {
    try {
      const { level } = req.query;
      let data;
      if (level) {
        data = await sentencesRepository.findByLevel(level);
      } else {
        data = await sentencesRepository.findAll();
      }
      res.json(data);
    } catch (err) {
      console.error('Error in getAllSentences controller:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * GET /api/sentences/:id
   */
  async getSentenceById(req, res) {
    try {
      const { id } = req.params;
      const sentence = await sentencesRepository.findById(id);
      if (!sentence) {
        return res.status(404).json({ error: `Sentence with ID ${id} not found` });
      }
      res.json(sentence);
    } catch (err) {
      console.error('Error in getSentenceById controller:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new SentencesController();
