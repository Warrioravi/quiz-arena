# 🏆 Real-Time Quiz Arena

A distributed, low-latency multiplayer educational platform. This application allows users to create and enter isolated quiz rooms (Arenas) to compete in real-time, featuring a live leaderboard and instant answer validation.

## 🚀 Features
* **Real-Time Multiplayer:** Sub-100ms UI responsiveness using WebSockets.
* **Live Leaderboards:** Instant ranking calculations using Redis Sorted Sets.
* **Fault Tolerant:** Built-in mobile connection recovery and atomic database transactions.
* **Persistent Archiving:** Automatic end-of-game data offloading to MongoDB.(Future improvement)

## 🛠 Tech Stack
* **Frontend:** Next.js, React, Tailwind CSS (Glassmorphism UI)
* **Backend:** Node.js, Express, Socket.io
* **Real-Time Data:** Upstash Redis (Serverless Cloud Cache)
* **Testing:** Jest, React Testing Library, Supertest

---

## 📁 Project Structure

This repository is structured as a monorepo, keeping the frontend and backend environments perfectly isolated.

```text
quiz-arena/
├── quiz-client/               # Next.js Frontend Environment
│   ├── app/                   # React Components and Pages
│   ├── public/                # Static assets (images, icons)
│   ├── package.json           # Frontend dependencies
│   └── next.config.ts         # Next.js configuration
│
└── quiz-server/               # Node.js Backend Environment
    ├── __tests__/             # Backend test suite (Supertest)
    ├── server.js              # Main Socket.io and Redis server logic
    ├── package.json           # Backend dependencies (socket.io, redis, express)
    └── .env                   # Environment variables (Upstash URL, Ports)
```

---

## 🏗 System Architecture

The system architecture prioritizes horizontal scalability and strict reliability patterns to protect against high-velocity data race conditions and concurrent write conflicts.

```mermaid
graph TD
    subgraph Client Layer
        C1[Client 1: Next.js UI]
        C2[Client 2: Next.js UI]
    end

    subgraph Infrastructure Layer
        LB[Load Balancer / API Gateway]
    end

    subgraph Application Layer
        S1[Node.js Server 1: Socket.io]
        S2[Node.js Server 2: Socket.io]
    end

    subgraph Real-Time State Layer
        R[(Upstash Redis: Cloud Cache \n Sorted Sets)]
    end

    subgraph Long-Term Persistence Layer
        DB[(MongoDB: Document Store \n Quiz Archive)]
    end

    C1 <-->|WebSockets| LB
    C2 <-->|WebSockets| LB

    LB <--> S1
    LB <--> S2

    S1 <-->|Atomic Updates| R
    S2 <-->|Atomic Updates| R
    
    S1 -.->|Async Archiving| DB
    S2 -.->|Async Archiving| DB
```

### Component Breakdown
* **Client Application:** Component-driven UI managing local state (instant correctness animations) and persistent WebSocket connections.
* **Application Server:** A fleet of stateless, event-driven servers handling WebSocket pools and compartmentalizing quiz sessions into isolated virtual channels.
* **In-Memory State Layer:** An ultra-low-latency Upstash Redis cache acting as the single source of truth for active games, handling concurrent additions via atomic operations.


---

## 🔄 Data Flow & State Lifecycle

The application divides data into distinct lifecycle phases to optimize for performance, budget, and memory safety:

### Phase 1: High-Speed Mutability (Active Game)
1. The client selects an option and clicks **"Check Answer"**. The UI instantly renders locally and emits a payload to the server.
2. The server triggers an **atomic Redis operation** (`ZINCRBY`).
3. Redis processes this addition natively in $O(\log(N))$ time complexity. Even if thousands of players submit answers at the exact same millisecond, Redis serializes the actions, preventing data loss.
4. The server executes `ZRANGE` and pushes a unified `leaderboard_update` strictly to the Top 10 users to preserve client bandwidth.

### Phase 2: Immutability & Archiving (Game Over)
Holding inactive quizzes in Redis RAM causes memory leaks. When an arena ends:
1. The server extracts the final rankings from the Upstash Sorted Set.
2. The server saves the structured JSON document permanently into a **MongoDB collection**.
3. The server fires a `DEL` command to purge the Redis key, freeing up memory, and cleanly disbands the Socket room.

---

## 📈 Scalability & Performance

* **Horizontal Server Scaling:** Servers are entirely stateless. New Node containers can be dynamically spun up by an auto-scaler without causing data fragmentation.
* **Database Offloading:** By using Redis Sorted Sets, array sorting operations are executed natively by the database engine, preventing the single-threaded Node.js event loop from blocking.
* **Future Scale (1M+ Users):** To transition to enterprise scale, the system would decouple connections via AWS API Gateway, implement Node-level micro-batching to prevent Redis "hot key" throttling, and transition broadcasts to a fixed 1Hz "Tick Rate" loop to guarantee flat network bandwidth usage.

---

## 🛡 Reliability & Error Containment

The system minimizes the **Blast Radius** of failures so single network drops do not collapse the platform.

* **Process Isolation:** Every Socket.io event is encapsulated in a `try/catch` block. Corrupted data fails gracefully without crashing the Node process for other participants.
* **Network Resilience:** Implements Socket.io `connectionStateRecovery`. If a player's internet drops, their state is buffered and restored upon reconnection.
* **Cloud-Native Diagnostics:** Features `/health/live` and `/health/ready` endpoints. If Upstash or MongoDB drops, the readiness probe outputs an HTTP `503`, prompting the Load Balancer to instantly reroute traffic.

---

## 🚦 Getting Started

### Prerequisites
* Node.js (v18+)
* An [Upstash Redis](https://upstash.com/) account & connection URL
* MongoDB (Local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/quiz-arena.git](https://github.com/yourusername/quiz-arena.git)
   cd quiz-arena
   ```

2. Install dependencies for both environments:
   ```bash
   # Install backend dependencies
   cd quiz-server && npm install
   
   # Install frontend dependencies
   cd ../quiz-client && npm install
   ```

3. Set up environment variables in the `quiz-server/` directory (`.env`):
   ```env
   PORT=3001
   UPSTASH_REDIS_URL=rediss://default:YOUR_PASSWORD@your-endpoint.upstash.io:32000
   ```

### Running Locally
Open two terminal windows.

**Terminal 1 (Backend):**
```bash
cd quiz-server
npm start
```

**Terminal 2 (Frontend):**
```bash
cd quiz-client
npm run dev
```
Navigate to `http://localhost:3000` to start playing!

---

## 🧪 Testing
Both application layers are tested using decoupled testing paradigms.

* **Frontend:** Uses Jest + React Testing Library. The `socket.io-client` is fully mocked to programmatically test user event flows without requiring a live server.
* **Backend:** Uses Jest + Supertest. Executes tests on dynamically allocated ports to prevent CI/CD collisions, fully mocking Redis and MongoDB to ensure deterministic execution.

**Run tests:**
```bash
# In the quiz-client directory
npm test

# In the quiz-server directory
npm test
# For running concurrency tests

npm run test:concurrency
```
