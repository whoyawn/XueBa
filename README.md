# Full Stack Hello World Project

This is a full-stack web application demonstrating the use of:
- Frontend: Gleam with Lustre (functional web framework)
- Backend: Rust with Rocket (web framework)

## Project Structure

```
.
├── client/     # Gleam/Lustre frontend application
└── server/      # Rust/Rocket backend application
```

## Prerequisites

- Gleam (latest version)
- Rust (latest stable version)
- Node.js (for Lustre development)

## Getting Started

### Backend

```bash
cd server
cargo run
```

The backend will be available at `http://localhost:8000`

### Frontend

```bash
cd client
gleam run -m lustre/dev start
```

The frontend will be available at `http://localhost:3000`

## Development

- Frontend development server: `cd client && gleam run --watch`
- Backend development server: `cd server && cargo watch -x run`
