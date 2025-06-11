const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
const axios = require('axios') 
const Sentiment = require('./models/sentimentModel') 
const port = process.env.PORT || 3000

app.use(express.json()); 
app.use(cors());

async function connectdb() {
  try {
    await mongoose.connect('mongodb+srv://dbuser:dbpass@cluster0.es9yslc.mongodb.net/SentimentDatabse')
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

connectdb()

async function postWithRetry(url, payload, maxRetries = 2, retryDelay = 2000) {
  let attempt = 0;
  const baseUrl = url.split('/analyse')[0]; // Get base URL for ping

  // Wake up server with GET /ping
  try {
    await axios.get(`${baseUrl}/ping`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Node.js Server',
        'Accept': 'application/json'
      }
    });
    console.log('GET ping sent to wake Flask API');
  } catch (err) {
    console.warn('Ping request failed (may still wake server):', err.message);
  }

  while (attempt <= maxRetries) {
    try {
      return await axios.post(url, payload, {
        timeout: 50000, 
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js Server',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      const status = error.response?.status;
      if (attempt < maxRetries && (status === 503 || !error.response)) {
        console.warn(`Retrying request... attempt ${attempt + 1}`);
        await new Promise(res => setTimeout(res, retryDelay));
        attempt++;
        continue;
      }
      throw error;
    }
  }
}

app.post('/api', async (req, res) => {
  const statement = req.body.statement;
  console.log(statement);
  
  if (!statement) {
    return res.status(400).json({ error: 'Statement is required' });
  }

  try {
    const response = await postWithRetry('https://flask-api-yofd.onrender.com/analyse', { statement });
    const data = response.data;

    const sentiment = new Sentiment({
      Statement: statement,
      sentiment: data.polarity
    });
    await sentiment.save();

    return res.json(data);
    
  } catch (error) {
    console.error('Axios error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.message || 'Error from external API' });
    } else {
      return res.status(500).json({ error: 'Failed to reach Flask API' });
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
