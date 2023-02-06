import { createServer } from "node:http";

import { createReadStream } from "node:fs";

import { Readable, Transform } from "node:stream";

import { WritableStream, TransformStream } from "node:stream/web";

import { setTimeout } from "node:timers/promises";

import csvtojson from "csvtojson";

const PORT = 3333;

createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*"
  }

  if(request.method === "OPTIONS") {
    response.writeHead(204, headers);
    
    return response.end();
  }

  let items = 0;

  const abortController = new AbortController();

  request.once("close", () => {
    console.log(`Connection was closed. Total items: ${items}`);

    abortController.abort();
  })

  try {
    response.writeHead(200, headers);

    await Readable.toWeb(createReadStream("./animeflv.csv"))
      .pipeThrough(Transform.toWeb(csvtojson()))
      .pipeThrough(new TransformStream({
        transform(chunk, controller) {
          const data = JSON.parse(Buffer.from(chunk));

          const mappedData = {
            title: data.title,
            description: data.description,
            image: data.image,
            url_anime: data.url_anime
          }

          controller.enqueue(JSON.stringify(mappedData).concat("\n"));
        }
      }))
      .pipeTo(new WritableStream({
        async write(chunk) {
          items++;

          response.write(chunk);
        },

        close() {
          response.end();
        }
      }), {
        signal: abortController.signal
      })
  }

  catch (error) {
    if(!error.message.includes("abort")) throw error
  }
})
  .listen(PORT)
  .on("listening", () => console.log(`Webstream server is running at: ${PORT} 🚀`))
