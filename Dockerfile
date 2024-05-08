FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun upgrade
RUN bun install
RUN bun build --compile --minify index.ts --outfile db-server

CMD ["./db-server"]
