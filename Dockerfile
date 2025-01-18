FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .

RUN go build -o main ./*.go
RUN chmod +x main

FROM node:18 AS ts-builder

WORKDIR /web

COPY web/tsconfig.json ./tsconfig.json
COPY web/src/ ./src/

RUN npm install -g typescript

RUN tsc -p tsconfig.json

FROM golang:1.23

WORKDIR /app

COPY --from=builder /app/main .

COPY .env .env

COPY --from=ts-builder /web/src/ ./web/dist/

EXPOSE 8080

CMD [ "./main" ]
