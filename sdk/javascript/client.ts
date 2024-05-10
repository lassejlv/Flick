import * as net from "net";

export interface FlickOptions {
  port: number;
  host: string;
}

export interface FlickCommand {
  type: "COMMAND";
  command:
    | "GET"
    | "GET_MANY"
    | "GET_ALL"
    | "DELETE"
    | "SET"
    | "PING"
    | "CREATE_COLLECTION"
    | "DELETE_COLLECTION"
    | "LIST_COLLECTIONS";
  collection?: string;
  auth?: {
    user: string;
    password: string;
  };
  commands?: {
    get?: {
      key: string;
    };
    delete?: {
      key: string;
    };
    set?: {
      key: string;
      data: any;
    };
    create_collection?: {
      name: string;
    };
    delete_collection?: {
      name: string;
    };
    get_many?: {
      keys?: string[];
      limit?: number;
    };
    get_all?: {
      limit?: number;
    };
  };
}

export class FlickClient {
  private client: net.Socket;
  private connected: boolean;

  constructor(private options: FlickOptions) {
    this.client = new net.Socket();
    this.connected = false;

    this.client.on("error", (err: Error) => {
      console.error("Database connection error:", err);
      this.connected = false;
    });

    this.client.on("close", () => {
      console.log("Connection to database has been closed");
      this.connected = false;
    });
  }

  checkError = async (message: string) => {
    if (message.includes("[ERROR]")) {
      throw new Error(message);
    }
  };

  connect(): Promise<void> {
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

  sendCommand(command: FlickCommand): Promise<string> {
    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          this.client.write(JSON.stringify(command));
          this.client.once("data", (data) => {
            const message = data.toString();

            // Check for any errors
            this.checkError(message);

            if (command.command === "PING") {
              resolve(JSON.parse(message));
            }

            // Check if it can parse the data to json
            try {
              const parsed = JSON.parse(message);
              resolve(parsed);
            } catch (error: any) {
              if (error.message.includes("JSON")) reject();

              reject(error);
            }
          });
        })
        .catch(reject);
    });
  }

  get(collection: string, key: string) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "GET",
      collection: collection,
      commands: { get: { key: key } },
    };
    return this.sendCommand(command);
  }

  getMany(collection: string, keys: string[]) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "GET_MANY",
      collection: collection,
      commands: { get_many: { keys: keys } },
    };

    return this.sendCommand(command);
  }

  getAll(collection: string, limit?: number) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "GET_ALL",
      collection: collection,
      commands: {
        get_all: {
          limit,
        },
      },
    };

    return this.sendCommand(command);
  }

  delete(collection: string, key: string): Promise<string> {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "DELETE",
      collection: collection,
      commands: { delete: { key: key } },
    };

    return this.sendCommand(command);
  }

  set(collection: string, key: string, data: any) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "SET",
      collection: collection,
      commands: { set: { key: key, data } },
    };

    return this.sendCommand(command);
  }

  ping() {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "PING",
    };

    return this.sendCommand(command);
  }

  createCollection(name: string) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "CREATE_COLLECTION",
      commands: { create_collection: { name } },
    };

    return this.sendCommand(command);
  }

  deleteCollection(name: string) {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "DELETE_COLLECTION",
      commands: { delete_collection: { name } },
    };

    return this.sendCommand(command);
  }

  listCollections() {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "LIST_COLLECTIONS",
    };

    return this.sendCommand(command);
  }

  // Implement other methods similarly

  close(): void {
    this.client.end();
    this.connected = false;
  }
}
