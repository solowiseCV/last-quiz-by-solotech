const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goatvote';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
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

// User schema and model to track who voted
const userSchema = new mongoose.Schema({
    name: String,
    hasVoted: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

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
    const { player, userName } = req.body;

    // Check if the user has already voted
    const user = await User.findOne({ name: userName });
    if (user && user.hasVoted) {
        return res.status(400).send({ message: 'You have already voted' });
    }

    // Record the vote
    const vote = await Vote.findOne({ player });
    if (vote) {
        vote.count++;
        await vote.save();
    }

    // Update user vote status
    if (user) {
        user.hasVoted = true;
        await user.save();
    } else {
        await new User({ name: userName, hasVoted: true }).save();
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
