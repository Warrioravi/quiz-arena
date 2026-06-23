// test-concurrency.js
require('dotenv').config(); // Load backend environment variables
const { io } = require("socket.io-client");
const { createClient } = require("redis"); // Import Redis client to handle post-test cleanup

const PORT = process.env.PORT || 3001;
const SERVER_URL = `http://127.0.0.1:${PORT}`;
const QUIZ_ID = `quiz_stress_test_${Date.now()}`;
const TARGET_USER_ID = "user_alpha2";
const NUMBER_OF_CONCURRENT_REQUESTS = 50;
const POINTS_PER_ANSWER = 10;

async function runConcurrencyTest() {
    console.log(`Starting Concurrency Test on Room [${QUIZ_ID}]...`);
    console.log(`Firing ${NUMBER_OF_CONCURRENT_REQUESTS} simultaneous score updates...`);
    
    // 1. Create a single monitor client to watch the leaderboard
    const monitorClient = io(SERVER_URL, { transports: ['websocket'] });
    
    monitorClient.on("connect_error", (err) => {
        console.error(`❌ Monitor Connection Failed: ${err.message}`);
        process.exit(1);
    });

    monitorClient.on("connect", () => {
        monitorClient.emit("join_quiz", { quizId: QUIZ_ID, userId: "monitor" });
    });

    monitorClient.on("leaderboard_update", (leaderboard) => {
        const targetUser = leaderboard.find(u => u.userId === TARGET_USER_ID);
        if (targetUser) {
            console.log(`[Monitor] Leaderboard Update -> ${TARGET_USER_ID} Score: ${targetUser.score}`);
        }
    });

    // Wait a second for the monitor to connect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Create the array of simulated clients
    const clients = [];
    for (let i = 0; i < NUMBER_OF_CONCURRENT_REQUESTS; i++) {
        const client = io(SERVER_URL, { transports: ['websocket'] });
        clients.push(
            new Promise((resolve) => {
                client.on("connect", () => {
                    client.emit("join_quiz", { quizId: QUIZ_ID, userId: `simulated_user_${i}` });
                    resolve(client);
                });
            })
        );
    }

    const connectedClients = await Promise.all(clients);
    console.log(`\nAll ${NUMBER_OF_CONCURRENT_REQUESTS} clients connected. Ready to fire.`);

    // 3. THE STRESS TEST
    const fireEvents = connectedClients.map(client => {
        return new Promise((resolve) => {
            client.emit("submit_answer", { 
                quizId: QUIZ_ID, 
                userId: TARGET_USER_ID, 
                isCorrect: true, 
                points: POINTS_PER_ANSWER 
            });
            resolve();
        });
    });

    await Promise.all(fireEvents);
    console.log(`\nFired ${NUMBER_OF_CONCURRENT_REQUESTS} updates for ${TARGET_USER_ID} simultaneously!`);
    console.log(`Expected Final Score should be: ${NUMBER_OF_CONCURRENT_REQUESTS * POINTS_PER_ANSWER}`);
    
    // 4. POST-TEST CLEANUP: Disconnect sockets and purge the Redis key
    setTimeout(async () => {
        console.log('\nCleaning up active network connections...');
        connectedClients.forEach(client => client.disconnect());
        monitorClient.disconnect();
        
        console.log('Connecting directly to Redis for database flush...');
        const cleanupClient = createClient({ url: process.env.REDIS_URL });
        
        try {
            await cleanupClient.connect();
            
            // Generate the exact key format your server.js uses
            const leaderboardKey = `quiz:${QUIZ_ID}:leaderboard`; 
            
            // Delete the key completely from Upstash
            const deletedKeysCount = await cleanupClient.del(leaderboardKey);
            
            if (deletedKeysCount > 0) {
                console.log(`🗑️ Successfully purged [${leaderboardKey}] from Redis memory.`);
            } else {
                console.log(`⚠️ Warning: Target key not found or already deleted.`);
            }
        } catch (redisError) {
            console.error('❌ Failed to clean up Redis memory:', redisError.message);
        } finally {
            await cleanupClient.disconnect();
            console.log('Test complete. Exiting.');
            process.exit(0);
        }
    }, 3000);
}

runConcurrencyTest();