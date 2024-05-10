// client.ts
import * as net from "net";

class FlickClient {
  options;
  client;
  connected;
  constructor(options) {
    this.options = options;
    this.client = new net.Socket;
    this.connected = false;
    this.client.on("error", (err) => {
      console.error("Database connection error:", err);
      this.connected = false;
    });
    this.client.on("close", () => {
      console.log("Connection to database has been closed");
      this.connected = false;
    });
  }
  checkError = async (message) => {
    if (message.includes("[ERROR]")) {
      throw new Error(message);
    }
  };
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      } else {
        this.client.connect(this.options, () => {
          this.connected = true;
          resolve();
        });
        this.client.on("error", (err) => reject(err));
      }
    });
  }
  sendCommand(command) {
    return new Promise((resolve, reject) => {
      this.connect().then(() => {
        this.client.write(JSON.stringify(command));
        this.client.once("data", (data) => {
          const message = data.toString();
          this.checkError(message);
          if (command.command === "PING") {
            resolve(JSON.parse(message));
          }
          try {
            const parsed = JSON.parse(message);
            resolve(parsed);
          } catch (error) {
            if (error.message.includes("JSON"))
              reject();
            reject(error);
          }
        });
      }).catch(reject);
    });
  }
  get(collection, key) {
    const command = {
      type: "COMMAND",
      command: "GET",
      collection,
      commands: { get: { key } }
    };
    return this.sendCommand(command);
  }
  getMany(collection, keys) {
    const command = {
      type: "COMMAND",
      command: "GET_MANY",
      collection,
      commands: { get_many: { keys } }
    };
    return this.sendCommand(command);
  }
  delete(collection, key) {
    const command = {
      type: "COMMAND",
      command: "DELETE",
      collection,
      commands: { delete: { key } }
    };
    return this.sendCommand(command);
  }
  set(collection, key, data) {
    const command = {
      type: "COMMAND",
      command: "SET",
      collection,
      commands: { set: { key, data } }
    };
    return this.sendCommand(command);
  }
  ping() {
    const command = {
      type: "COMMAND",
      command: "PING"
    };
    return this.sendCommand(command);
  }
  createCollection(name) {
    const command = {
      type: "COMMAND",
      command: "CREATE_COLLECTION",
      commands: { create_collection: { name } }
    };
    return this.sendCommand(command);
  }
  deleteCollection(name) {
    const command = {
      type: "COMMAND",
      command: "DELETE_COLLECTION",
      commands: { delete_collection: { name } }
    };
    return this.sendCommand(command);
  }
  close() {
    this.client.end();
    this.connected = false;
  }
}
var client_default = FlickClient;
export {
  client_default as default,
  FlickClient
};
