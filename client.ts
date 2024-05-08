import * as net from "net";

interface FlickOptions {
  port: number;
  host: string;
}

interface FlickCommand {
  type: "COMMAND";
  command: "GET" | "SET" | "DELETE" | "PING";
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
      data: any;
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
            } else {
              resolve(message);
            }
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

  set(collection: string, key: string, data: any): Promise<string> {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "SET",
      collection: collection,
      commands: { set: { key: key, data } },
    };

    return this.sendCommand(command);
  }

  ping(): Promise<string> {
    const command: FlickCommand = {
      type: "COMMAND",
      command: "PING",
    };

    return this.sendCommand(command);
  }

  // Implement other methods similarly

  close(): void {
    this.client.end();
  }
}

export default FlickClient;
