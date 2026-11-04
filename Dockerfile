FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build

FROM golang:1.23-alpine AS backend-builder

WORKDIR /app

COPY go.mod go.sum* ./
COPY internal/argoversioned/go.mod internal/argoversioned/go.sum* ./internal/argoversioned/
COPY internal/fluxcdversioned/go.mod internal/fluxcdversioned/go.sum* ./internal/fluxcdversioned/

RUN go mod download

COPY . .

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o kubernetes-dashboard .

FROM alpine:3.19

# Add ca-certificates for HTTPS and git for branch listing
RUN apk --no-cache add ca-certificates git

RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

COPY --from=backend-builder /app/kubernetes-dashboard .

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/livez || exit 1

CMD ["./kubernetes-dashboard"]
