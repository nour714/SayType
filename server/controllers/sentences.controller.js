const sentencesRepository = require('../repositories/sentences.repository');

/**
 * SentencesController — handles REST API request/response processing for sentences.
 */
class SentencesController {
  /**
   * GET /api/sentences
   * Optional query params: ?level=A1&topic=daily-life
   */
  async getAllSentences(req, res) {
    try {
      const { level, topic } = req.query;
      let data;
      if (level && topic) {
        data = await sentencesRepository.findByLevelAndTopic(level, topic);
      } else if (level) {
        data = await sentencesRepository.findByLevel(level);
      } else if (topic) {
        data = await sentencesRepository.findByTopic(topic);
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
   * GET /api/sentences/topics
   * Returns list of available topics
   */
  async getTopics(req, res) {
    try {
      const topics = await sentencesRepository.getTopics();
      res.json(topics);
    } catch (err) {
      console.error('Error in getTopics controller:', err);
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
