const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Vote schema and model
const voteSchema = new mongoose.Schema({
    player: String,
    count: Number,
});

const Vote = mongoose.model('Vote', voteSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize vote counts in the database if they don't exist
async function initializeVotes() {
    const messiVote = await Vote.findOne({ player: 'messi' });
    const ronaldoVote = await Vote.findOne({ player: 'ronaldo' });

    if (!messiVote) {
        await new Vote({ player: 'messi', count: 0 }).save();
    }

    if (!ronaldoVote) {
        await new Vote({ player: 'ronaldo', count: 0 }).save();
    }
}

initializeVotes();

// Routes
app.post('/vote', async (req, res) => {
    const { player } = req.body;
    const vote = await Vote.findOne({ player });
    if (vote) {
        vote.count++;
        await vote.save();
    }
    res.send({ message: 'Vote recorded' });
});

app.get('/votes', async (req, res) => {
    const votes = await Vote.find({});
    const response = votes.reduce((acc, vote) => {
        acc[vote.player] = vote.count;
        return acc;
    }, {});
    res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
