const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
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


app.post('/api', async (req, res) => {

    statement = req.body.statement
    console.log(statement);
    
    if (!statement) {
        return res.status(400).json({ error: 'Statement is required' });
    }
    try {
        const response = await fetch('https://flask-api-yofd.onrender.com/analyse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statement })
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Error from external API' });
        }
        else {
            
            
            const sentiment = new Sentiment({
                Statement: statement,
                sentiment: data.polarity
            });
            await sentiment.save();
            return res.json(data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch from external API' });
    }
    
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
