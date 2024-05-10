import * as net from "net";

export interface FlickOptions {
  port: number;
  host: string;
}

export interface FlickCommand {
  type: "COMMAND";
  command: "GET" | "GET_MANY" | "DELETE" | "SET" | "PING" | "CREATE_COLLECTION" | "DELETE_COLLECTION";
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
  };
}

export class FlickClient {
  private client: net.Socket;
  private connected: boolean;

  constructor(options: FlickOptions);

  private checkError(message: string): Promise<void>;

  connect(): Promise<void>;

  sendCommand(command: FlickCommand): Promise<string>;

  get(collection: string, key: string): Promise<string>;

  getMany(collection: string, keys: string[]): Promise<string>;

  delete(collection: string, key: string): Promise<string>;

  set(collection: string, key: string, data: any): Promise<string>;

  ping(): Promise<string>;

  createCollection(name: string): Promise<string>;

  deleteCollection(name: string): Promise<string>;

  close(): void;
}
