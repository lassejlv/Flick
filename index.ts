import * as net from "net";
import fs from "fs";
import FlickClient from "./client";

const volume = "/Users/lasse/Documents/dev/Flick/data";

interface JsonResponse {
  type: "COMMAND";
  command?: "GET" | "DELETE" | "SET" | "PING";
  collection?: string;
  commands?: {
    get?: {
      key: string;
    };
    delete?: {
      key: string;
    };
    set?: {
      key: string;
      data: object;
    };
  };
}

const server = net.createServer((socket) => {
  console.log("New user connected!");

  socket.on("data", async (data) => {
    const start = Date.now();
    const message = data.toString();

    try {
      const parsedMessage = JSON.parse(message) as JsonResponse;

      // Valdidate the response
      if (!parsedMessage.type) return socket.write("[ERROR] Missing Type");
      if (parsedMessage.type !== "COMMAND") return socket.write("[ERROR] Not a valid type");
      if (!parsedMessage.collection && parsedMessage.command !== "PING")
        return socket.write("[ERROR] None provided collection");

      // Check volume path
      if (!fs.existsSync(volume)) return socket.write("[ERROR] volume does not exist at ...");

      if (parsedMessage.command) {
        // Switched the parsed command
        switch (parsedMessage.command) {
          // GET DATA
          case "GET": {
            if (!parsedMessage.commands?.get) return socket.write("[ERROR] Missing commands.get");
            if (!parsedMessage.commands.get.key) return socket.write("[ERROR] Missing commands.get.key");

            // Check if file exist
            if (!fs.existsSync(`${volume}/${parsedMessage.collection}.json`))
              return socket.write("[ERROR] collection " + parsedMessage.collection + " does not exist");

            // Get the json
            try {
              // Get the json
              const json = await Bun.file(`${volume}/${parsedMessage.collection}.json`).json();

              // Check if its an array
              if (!Array.isArray(json)) return socket.write(`[ERROR] ${parsedMessage.collection} is not an array`);

              // Check if res is 0
              if (json.length === 0) return socket.write(JSON.stringify([]));

              const results = [];

              // Loop the keys
              for (const val of json) {
                if (!val.key) continue;
                if (val.key !== parsedMessage.commands.get.key) continue;

                // @ts-ignore
                results.push(val.data);
              }

              return socket.write(JSON.stringify(results[0]));
            } catch (error) {
              socket.write(`[ERROR] ${error.message}`);
            }

            break;
          }

          // DELETE
          case "DELETE": {
            if (!parsedMessage.commands?.delete) return socket.write("[ERROR] Missing commands.delete");
            if (!parsedMessage.commands.delete.key) return socket.write("[ERROR] Missing commands.delete.key");

            // Check if file exist
            if (!fs.existsSync(`${volume}/${parsedMessage.collection}.json`))
              return socket.write("[ERROR] collection " + parsedMessage.collection + " does not exist");

            // Get the json
            try {
              // Get the json
              const json = await Bun.file(`${volume}/${parsedMessage.collection}.json`).json();

              // Check if its an array
              if (!Array.isArray(json)) return socket.write(`[ERROR] ${parsedMessage.collection} is not an array`);

              // Check if res is 0
              if (json.length === 0) return socket.write(JSON.stringify([]));

              // Loop the keys
              for (const val of json) {
                if (!val.key) continue;
                if (val.key !== parsedMessage.commands.delete.key) continue;

                // @ts-ignore
                const newData = json.filter((v) => v.key !== val.key);
                await Bun.write(`${volume}/${parsedMessage.collection}.json`, newData);
              }

              return socket.write(JSON.stringify({ success: true }));
            } catch (error) {
              socket.write(`[ERROR] ${error.message}`);
            }

            break;
          }

          // SET
          case "SET": {
            if (!parsedMessage.commands?.set) return socket.write("[ERROR] Missing commands.set");
            if (!parsedMessage.commands.set.key) return socket.write("[ERROR] Missing commands.delete.key");
            if (!parsedMessage.commands.set.data) return socket.write("[ERROR] Missing commands.delete.data");

            // @ts-ignore
            const parsedJson = JSON.parse(parsedMessage.commands.set.data);

            if (typeof parsedJson !== "object") return socket.write("[ERROR] commands.set.data is not an object");

            // Check if file exist
            if (!fs.existsSync(`${volume}/${parsedMessage.collection}.json`))
              return socket.write("[ERROR] collection " + parsedMessage.collection + " does not exist");

            console.log(parsedJson);

            // Get the json
            try {
              // Get the json
              const json = await Bun.file(`${volume}/${parsedMessage.collection}.json`).json();

              // Check if its an array
              if (!Array.isArray(json)) return socket.write(`[ERROR] ${parsedMessage.collection} is not an array`);

              // Check if res is 0
              if (json.length === 0) return socket.write(JSON.stringify([]));

              console.log(json);

              // // Loop the keys
              // for (const val of json) {
              //   if (!val.key) continue;
              //   if (val.key !== parsedMessage.commands.set.key) continue;

              //   // @ts-ignore
              //   val.data = parsedMessage.commands.set.data;
              //   await Bun.write(`${volume}/${parsedMessage.collection}.json`, json);
              // }

              return socket.write(JSON.stringify({ success: true }));
            } catch (error) {
              console.log(error);

              socket.write(`[ERROR] ${error.message}`);
            }

            break;
          }

          // PING
          case "PING": {
            const ms = start - Date.now();
            socket.write(`{"type": "ms", "time": "${ms.toFixed(10)}"}`);
            break;
          }

          // IF command does not exist
          default: {
            socket.write("[ERROR] command failed due to: command does not exist " + parsedMessage.command);
            break;
          }
        }
      }
    } catch (error: any) {
      socket.write(`[ERROR] ${error.message}`);
    }
  });

  socket.on("close", () => {
    console.log("User closed connection!");
  });
});

server.listen(8000, () => {
  console.log("Started on port 8000");
});

/// Client
const db = new FlickClient({ port: 8000, host: "localhost" });

db.connect();

const ping = await db.ping();

console.log(ping);
