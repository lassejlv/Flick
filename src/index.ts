import * as net from "net";
import fs from "fs";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { FlickCommand } from "../sdk/javascript/client";

const env = createEnv({
  server: {
    PORT: z.string(),
    VOLUME: z.string(),
    USERNAME: z.string().optional(),
    PASSWORD: z.string().optional(),
  },
  runtimeEnv: process.env,
});

const volume = env.VOLUME;

const server = net.createServer((socket) => {
  console.log("New user connected from: " + socket.remoteAddress + ":" + socket.remotePort);

  socket.on("data", async (data) => {
    const start = Date.now();
    const message = data.toString();

    try {
      const parsedMessage = JSON.parse(message) as FlickCommand;

      // Valdidate the response
      if (!parsedMessage.type) return socket.write("[ERROR] Missing Type");
      if (parsedMessage.type !== "COMMAND") return socket.write("[ERROR] Not a valid type");
      if (
        !parsedMessage.collection &&
        parsedMessage.command !== "PING" &&
        parsedMessage.command !== "CREATE_COLLECTION" &&
        parsedMessage.command !== "DELETE_COLLECTION"
      )
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
            if (typeof parsedMessage.commands.get.key !== "string") return socket.write("[ERROR] key is not a string");

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
              const notFound = false;

              // Loop the keys
              for (const val of json) {
                if (!val.key) continue;
                if (val.key !== parsedMessage.commands.get.key) continue;

                // @ts-ignore
                results.push(val.data);
              }

              if (notFound) return socket.write(`[ERROR] key ${parsedMessage.commands.get.key} does not exist`);

              return socket.write(JSON.stringify(results[0]));
            } catch (error) {
              socket.write(`[ERROR] ${error.message}`);
            }

            break;
          }

          case "GET_MANY": {
            if (!parsedMessage.commands?.get_many) return socket.write("[ERROR] Missing commands.get_many");

            // Check if file exist
            const limit = parsedMessage.commands.get_many.limit || 10;
            const keys = parsedMessage.commands.get_many.keys || [];

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
              const notFound = false;

              // Loop the keys
              for (const val of json) {
                if (!val.key) continue;
                if (!keys.includes(val.key)) continue;

                // @ts-ignore
                results.push(val.data);
              }

              if (notFound) return socket.write(`[ERROR] key ${parsedMessage.commands.get_many.keys} does not exist`);

              return socket.write(JSON.stringify(results));
            } catch (error) {
              return socket.write(`[ERROR] ${error.message}`);
            }

            break;
          }

          // DELETE
          case "DELETE": {
            if (!parsedMessage.commands?.delete) return socket.write("[ERROR] Missing commands.delete");
            if (!parsedMessage.commands.delete.key) return socket.write("[ERROR] Missing commands.delete.key");
            if (typeof parsedMessage.commands.delete.key !== "string")
              return socket.write("[ERROR] key is not a string");

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

              for (const val of json) {
                if (!parsedMessage.commands.delete.key || val.key !== parsedMessage.commands.delete.key) continue;

                // Remove the key
                json.splice(json.indexOf(val), 1);
                await Bun.write(`${volume}/${parsedMessage.collection}.json`, JSON.stringify(json));
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
            if (typeof parsedMessage.commands.set.data !== "object")
              return socket.write("[ERROR] data is not an object");

            // Check if file exist
            if (!fs.existsSync(`${volume}/${parsedMessage.collection}.json`))
              return socket.write("[ERROR] collection " + parsedMessage.collection + " does not exist");

            try {
              const data = parsedMessage.commands.set.data;
              const pathTo = `${volume}/${parsedMessage.collection}.json`;

              const json = await Bun.file(pathTo).json();

              // Check if its an array
              if (!Array.isArray(json)) return socket.write(`[ERROR] ${parsedMessage.collection} is not an array`);

              // If no data
              if (json.length === 0) {
                json.push({
                  key: parsedMessage.commands.set.key,
                  data: data,
                });

                // Convert json array to string before writing
                await Bun.write(pathTo, JSON.stringify(json));
              }

              for (const val of json) {
                // If the value already exist update the data
                if (val.key === parsedMessage.commands.set.key) {
                  val.data = data;
                  await Bun.write(pathTo, JSON.stringify(json));
                }

                // If the key does not exist
                if (val.key !== parsedMessage.commands.set.key) {
                  json.push({
                    key: parsedMessage.commands.set.key,
                    data: data,
                  });

                  await Bun.write(pathTo, JSON.stringify(json));
                }

                return socket.write(JSON.stringify({ success: true }));
              }
            } catch (error) {
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

          // prettier-ignore
          case "CREATE_COLLECTION": {
            if (!parsedMessage.commands?.create_collection) return socket.write("[ERROR] Missing commands.create_collection");
            if (!parsedMessage.commands.create_collection.name) return socket.write("[ERROR] Missing commands.create_collection.name");
            if (typeof parsedMessage.commands.create_collection.name !== "string") return socket.write("[ERROR] name is not a string");


            // If the collection already exist
            if (fs.existsSync(`${volume}/${parsedMessage.commands.create_collection.name}.json`)) return socket.write("[ERROR] collection already exist")
              
            await Bun.write(`${volume}/${parsedMessage.commands.create_collection.name}.json`, JSON.stringify([]))

            return socket.write(JSON.stringify({ success: true }));

            break;
          }

          // prettier-ignore
          case "DELETE_COLLECTION": {
            if (!parsedMessage.commands?.delete_collection) return socket.write("[ERROR] Missing commands.delete_collection");
            if (!parsedMessage.commands.delete_collection.name) return socket.write("[ERROR] Missing commands.delete_collection.name");
            if (typeof parsedMessage.commands.delete_collection.name !== "string") return socket.write("[ERROR] name is not a string");


            // If the collection already exist
            if (!fs.existsSync(`${volume}/${parsedMessage.commands.delete_collection.name}.json`)) return socket.write("[ERROR] collection does not exist")
              
            await fs.unlinkSync(`${volume}/${parsedMessage.commands.delete_collection.name}.json`)

            return socket.write(JSON.stringify({ success: true }));

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

server.listen(Number(env.PORT), () => {
  // Check if volume exist
  if (!fs.existsSync(volume)) {
    console.log("Volume does not exist at: " + volume);
    process.exit(1);
  }

  console.log("Volume path: " + volume);
  console.log("Server is running on port: " + env.PORT);
  console.log("Ready to accept connections");
});
