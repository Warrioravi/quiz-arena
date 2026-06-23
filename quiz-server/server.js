// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);

// ==========================================
// 1. OBSERVABILITY (Health Probes)
// ==========================================
// Liveness Probe: Tells Kubernetes/AWS the Node process is running
app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness Probe: Tells Load Balancer if we are connected to the DB
app.get('/health/ready', async (req, res) => {
    try {
        await redisClient.ping();
        res.status(200).json({ 
            status: 'ready', 
            activeSockets: io.engine.clientsCount 
        });
    } catch (error) {
        // 503 Service Unavailable: Routes traffic away from this instance
        res.status(503).json({ status: 'not_ready', error: 'Redis disconnected' });
    }
});

// ==========================================
// 2. SOCKET INITIALIZATION & RELIABILITY
// ==========================================
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    // RELIABILITY: Recovers user state if their mobile network drops briefly
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    }
});

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// ==========================================
// 3. REAL-TIME GAME LOGIC
// ==========================================
async function startServer() {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Cloud Redis securely.');

        io.on('connection', (socket) => {
            console.log(`[INFO] User connected: ${socket.id}`);

            // User Joins Arena
            socket.on('join_quiz', async ({ quizId, userId }) => {
                try {
                    socket.join(quizId);
                    
                    const leaderboardKey = `quiz:${quizId}:leaderboard`;
                    
                    // INITIALIZATION: Add user with 0 score if they don't exist
                    // NX ensures we don't overwrite their score if they just refreshed the page
                    await redisClient.zAdd(leaderboardKey, { score: 0, value: userId }, { NX: true });
                    
                    console.log(`[INFO] User ${userId} joined arena ${quizId}`);
                    await broadcastLeaderboard(quizId, leaderboardKey);
                } catch (error) {
                    console.error('[ERROR] join_quiz failed:', error.message);
                }
            });

            // Atomic Score Updates
            socket.on('submit_answer', async ({ quizId, userId, isCorrect, points }) => {
                try {
                    const leaderboardKey = `quiz:${quizId}:leaderboard`;

                    if (isCorrect) {
                        // ATOMIC INCREMENT: Prevents race conditions
                        await redisClient.zIncrBy(leaderboardKey, points, userId);
                    }
                    
                    // TTL GARBAGE COLLECTION: Prevent memory leaks
                    // Resets the room expiration to 24 hours after the last activity
                    await redisClient.expire(leaderboardKey, 86400);

                    await broadcastLeaderboard(quizId, leaderboardKey);

                } catch (error) {
                    console.error(`[ERROR] submit_answer failed for ${userId}:`, error.message);
                    // Emit error back to the specific user without crashing the server
                    socket.emit('error_message', { message: 'Failed to process score. Please retry.' });
                }
            });

            socket.on('disconnect', () => {
                console.log(`[INFO] User disconnected: ${socket.id}`);
            });
        });

        const PORT = process.env.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`Real-Time Quiz Server listening on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
async function broadcastLeaderboard(quizId, leaderboardKey) {
    try {
        // PERFORMANCE: Only fetch the Top 10 to save bandwidth
        const rawLeaderboard = await redisClient.zRangeWithScores(leaderboardKey, 0, 9, {
            REV: true 
        });

        const formattedLeaderboard = rawLeaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.value,
            score: entry.score
        }));

        io.to(quizId).emit('leaderboard_update', formattedLeaderboard);
    } catch (error) {
        console.error('[ERROR] broadcastLeaderboard failed:', error.message);
    }
}

// Only execute startServer if this file is run directly (useful for Jest testing later)
if (require.main === module) {
    startServer();
}

module.exports = { app, server ,startServer};