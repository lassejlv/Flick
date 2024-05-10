import { FlickClient } from "./client";
import { performance } from "perf_hooks";

const client = new FlickClient({
  port: 8000,
  host: "localhost",
});

const newUser = await client.get("users", "lasse");
console.log(newUser);

async function benchmarkDatabase() {
  await client.connect();
  console.log("Connected to database!");

  let totalDuration = 0;
  let requestCount = Number(prompt("How many requests do you want to make?"));

  for (let i = 0; i < requestCount; i++) {
    const startTime = performance.now();
    const user = await client.get("users", "lasse"); // Assuming 'get' returns a promise
    const endTime = performance.now();

    const duration = endTime - startTime;
    totalDuration += duration;

    console.log(`Request ${i}: ${duration.toFixed(2)} ms`);
  }

  console.log(`Average request time: ${(totalDuration / requestCount).toFixed(2)} ms`);
  console.log(`Total time for ${requestCount} requests: ${totalDuration.toFixed(2)} ms`);
}

benchmarkDatabase();
