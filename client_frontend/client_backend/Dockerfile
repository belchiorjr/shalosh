# syntax=docker/dockerfile:1

FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/client_backend ./cmd/client_backend

FROM alpine:3.20
WORKDIR /app

ENV PORT=8080

COPY --from=builder /bin/client_backend /usr/local/bin/client_backend

EXPOSE 8080

CMD ["/usr/local/bin/client_backend"]
