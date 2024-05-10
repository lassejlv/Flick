FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun upgrade
RUN bun install
RUN bun build --compile --minify index.ts --outfile db-server

# Enable "/Users/lasse/Documents/dev/Flick/data" as a volume
VOLUME /Users/lasse/Documents/dev/Flick/data

CMD ["./db-server"]
