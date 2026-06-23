// __tests__/server.test.js
process.env.PORT = 0; // CRITICAL: Forces Node to pick a random, empty port to prevent EADDRINUSE crashes

const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

// ==========================================
// DYNAMIC REDIS MOCK INJECTION
// ==========================================
const mockPing = jest.fn().mockResolvedValue("PONG");
const mockZAdd = jest.fn().mockResolvedValue(1);
const mockZIncrBy = jest.fn().mockResolvedValue(10);
const mockExpire = jest.fn().mockResolvedValue(1);
const mockZRange = jest.fn().mockResolvedValue([
    { value: "user_alpha", score: 10 }
]);

jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
        ping: mockPing,
        zAdd: mockZAdd,
        zIncrBy: mockZIncrBy,
        expire: mockExpire,
        zRangeWithScores: mockZRange,
    }))
}));

const { app, server, startServer } = require('../server');

describe("Real-Time Server Architecture & Reliability", () => {
    let port;
    let clientA;

    // --- TEST SUITE LIFECYCLE ---
    beforeAll(async () => {
        await startServer();
        await new Promise((resolve) => {
            if (server.listening) {
                port = server.address().port;
                resolve();
            } else {
                server.on('listening', () => {
                    port = server.address().port;
                    resolve();
                });
            }
        });
    });

    beforeEach((done) => {
        jest.clearAllMocks();
        clientA = new Client(`http://127.0.0.1:${port}`, { 
            transports: ['websocket'],
            forceNew: true,
            multiplex: false 
        });
        clientA.on('connect', done);
        clientA.on('connect_error', (err) => done(err));
    });

    afterEach(() => {
        clientA.disconnect();
    });

    afterAll((done) => {
        server.close(done);
    });

    // ==========================================
    // SCENARIO 1: Infrastructure Fault Tolerance
    // ==========================================
    it("should return 503 from readiness probe if Redis disconnects", async () => {
        mockPing.mockRejectedValueOnce(new Error("Redis Connection Lost"));

        const res = await request(app).get('/health/ready');
        expect(res.statusCode).toEqual(503);
        expect(res.body.status).toEqual('not_ready');
    });

    // ==========================================
    // SCENARIO 2: Data Idempotency (The Refresh Bug)
    // ==========================================
    it("should use NX flag on join to prevent overwriting existing scores", (done) => {
        clientA.emit('join_quiz', { quizId: 'ROOM_1', userId: 'user_123' });

        setTimeout(() => {
            expect(mockZAdd).toHaveBeenCalledWith(
                'quiz:ROOM_1:leaderboard',
                { score: 0, value: 'user_123' },
                { NX: true }
            );
            done();
        }, 50);
    });

    // ==========================================
    // SCENARIO 3: Memory Management & Conditional State
    // ==========================================
    it("should update TTL but NOT increment score if answer is incorrect", (done) => {
        clientA.emit('submit_answer', {
            quizId: 'ROOM_1',
            userId: 'user_123',
            isCorrect: false,
            points: 10
        });

        setTimeout(() => {
            expect(mockZIncrBy).not.toHaveBeenCalled();
            expect(mockExpire).toHaveBeenCalledWith('quiz:ROOM_1:leaderboard', 86400);
            done();
        }, 50);
    });

    // ==========================================
    // SCENARIO 4: Graceful Degradation (Blast Radius)
    // ==========================================
    it("should emit an 'error_message' to the client if the database transaction fails", (done) => {
        mockZIncrBy.mockRejectedValueOnce(new Error("Redis Transaction Failed"));

        clientA.on('error_message', (data) => {
            expect(data.message).toEqual('Failed to process score. Please retry.');
            done();
        });

        clientA.emit('submit_answer', {
            quizId: 'ROOM_ERROR',
            userId: 'user_123',
            isCorrect: true,
            points: 10
        });
    });
});