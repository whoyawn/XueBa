ARG GLEAM_VERSION=v1.9.1

# Build stage - compile the application
FROM ghcr.io/gleam-lang/gleam:${GLEAM_VERSION}-erlang-alpine AS builder

COPY ./ ./

# Run the server
RUN cd server
CMD ["cargo run"]

