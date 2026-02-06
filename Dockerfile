# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Copy package files
COPY web/package.json web/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source files
COPY web/ ./

# Build React app
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.22-alpine AS backend-builder

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy source files
COPY . .

# Copy frontend build from previous stage
COPY --from=frontend-builder /app/web/dist ./internal/server/dist

# Build Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o kubernetes-dashboard .

# Stage 3: Final runtime image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=backend-builder /app/kubernetes-dashboard .

# Expose port
EXPOSE 8080

# Set environment variable
ENV PORT=8080

# Run the binary
CMD ["./kubernetes-dashboard"]
