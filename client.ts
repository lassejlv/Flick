import * as net from "net";

interface FlickOptions {
  port: number;
  host: string;
}

interface FlickCommand {
  type: "COMMAND";
  command: "GET" | "SET" | "DELETE" | "PING";
  collection: string;
  commands: {
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

class FlickClient {
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

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
      } else {
        this.client.connect(this.options, () => {
          console.log("Connected to database");
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
            resolve(data.toString());
          });
        })
        .catch(reject);
    });
  }

  get(collection: string, key: string): Promise<string> {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "GET",
      collection: collection,
      commands: { get: { key: key } },
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

  set(collection: string, key: string, json_data: object): Promise<string> {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "SET",
      collection: collection,
      commands: { set: { key: key, data: JSON.stringify(json_data) } },
    };

    return this.sendCommand(command);
  }

  // Implement other methods similarly

  close(): void {
    this.client.end();
  }
}

export default FlickClient;
