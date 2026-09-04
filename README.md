# Chat API

Express + MongoDB backend for a real-time chat app: auth, friends, 1:1 messaging with attachments, Socket.IO presence/typing, and a built-in AI assistant.

## Stack

- Express 5, Mongoose, Socket.IO
- JWT auth via httpOnly cookie, bcrypt password hashing
- Google OAuth login (`google-auth-library`)
- Nodemailer (verification codes, password reset emails)
- Multer (avatar + message attachment uploads, served from `/uploads`)
- Zod (request validation)
- Swagger UI at `/api-docs`
- Pluggable AI provider (Groq / OpenAI / Anthropic / Gemini)

## Setup

```bash
npm install
cp .env.example .env   # fill in the values below
npm run seed            # creates the shared AI assistant account
npm run dev              # nodemon, http://localhost:5000
```

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Frontend origin - used for CORS, Socket.IO, and reset-password email links |
| `JWT_SECRET_KEY` | Secret used to sign the `chat_token` cookie |
| `USER` / `PASS` | Gmail address + App Password used to send verification/reset emails |
| `GOOGLE_CLIENT_ID` | OAuth client ID for "Sign in with Google" |
| `AI_PROVIDER` | `groq` \| `openai` \| `anthropic` \| `gemini` |
| `AI_MODEL` | Provider-specific model name |
| `AI_API_KEY` | API key for the chosen provider (server-side only) |
| `AI_CONTEXT_MESSAGES` | How many recent messages are sent as context to the LLM |
| `AI_TIMEOUT_MS` | Abort an AI provider request after this many ms |
| `AI_RATE_LIMIT` / `AI_RATE_LIMIT_WINDOW` | Per-user rate limit for `POST /api/ai/chat` |

Uploaded files (avatars, message attachments) are written to `uploads/` and served statically at `http://localhost:PORT/uploads/...`.

## API

Full interactive docs: `GET /api-docs` (Swagger UI).

### Auth - `/api/auth`
| Method | Route | Notes |
|---|---|---|
| POST | `/register` | Creates an unverified account, emails a 6-digit code |
| POST | `/verify-email` | `{ email, code }` - activates the account and logs in |
| POST | `/resend-code` | Resends the verification code (rate-limited) |
| POST | `/login` | `{ identifier, password }` - sets the `chat_token` cookie |
| POST | `/google` | `{ credential }` - Google ID token login/register |
| POST | `/forgot-password` | Emails a reset link |
| POST | `/reset-password/:token` | `{ password }` |
| POST | `/logout` | Clears the cookie |
| GET | `/me` | Returns the current user (requires auth) |

### Users & friends - `/api/users` (all require auth)
| Method | Route | Notes |
|---|---|---|
| GET | `/profile` | Own profile |
| PATCH | `/profile` | Multipart: `name`, `bio`, `avatar` file |
| GET | `/search?query=&page=&limit=` | Search users; each result includes relationship `status` |
| GET | `/friends` | Current friends list with online status |
| GET | `/friend-requests` | Pending incoming requests |
| POST | `/friend-request/:id` | Send a request (auto-accepts if the other side already sent one) |
| POST | `/friend-request/:id/respond` | `{ action: "accept" \| "reject" }` |
| GET | `/:id` | Public profile of any user |

### Messages - `/api/messages/:friendId` (requires auth + friendship)
| Method | Notes |
|---|---|
| GET `?page=&limit=` | Paginated history, newest first |
| POST | Multipart: `text` + up to 6 `files` (25MB each) |

### AI assistant - `/api/ai` (requires auth)
| Method | Route | Notes |
|---|---|---|
| GET | `/` | Returns the assistant's public profile + conversation id |
| POST | `/chat` | `{ text }` - rate-limited; returns `{ userMessage, aiMessage }` |

## Realtime (Socket.IO)

Connects using the same `chat_token` cookie (`withCredentials: true`).

| Event | Direction | Payload |
|---|---|---|
| `newMessage` | server → client | full message document (fires for both human and AI chats) |
| `typing` / `stopTyping` | client ↔ server | `{ to: userId }` out, `{ from: userId }` in |
| `presence` | server → all clients | `{ userId, online }` |
| `friendRequest` | server → client | `{ from: userCard }` |
| `friendRequestAccepted` | server → client | `{ by: userCard }` |

## Project structure

```
app.js              Express app: middleware, routes, error handler
server.js           HTTP server bootstrap, DB connect, Socket.IO init
ai/                 System prompt + provider adapter (Groq/OpenAI/Anthropic/Gemini)
configs/            DB connection, Swagger spec
controllers/        Route handlers (thin - delegate to services)
services/           Business logic
middlewares/        Auth guard, multer upload, AI rate limiter, error handler
models/             Mongoose schemas (User, Message, Conversation, FriendRequest)
routes/             Express routers
socket/             Socket.IO server setup (auth, rooms, presence)
validators/         Zod request schemas
scripts/createAiUser.js   Seeds the shared AI assistant account
uploads/            Static file storage for avatars/attachments
```
