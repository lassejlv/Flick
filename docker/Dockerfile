FROM oven/bun:latest

# Set working directory inside the container
WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git

# Copy everything from the current directory to the /app directory in the container
COPY . .

# Clone the repository directly into /app, ensure not to clone into a subdirectory
RUN git clone https://github.com/lassejlv/Flick FlickProject

# Change working directory to the FlickProject directory
WORKDIR /app/FlickProject

# Upgrade bun, install dependencies, and build the application
RUN bun upgrade
RUN bun install
RUN bun build --compile --minify src/index.ts --outfile db-server

# Define a volume mount point
VOLUME /tmp/root/flickdata-path

# Command to run the application
CMD ["./db-server"]