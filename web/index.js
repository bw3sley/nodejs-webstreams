const API_URL = "http://localhost:3333";

let counter = 0;

async function fetchAnimes(signal) {
    const response = await fetch(API_URL, {
        signal
    })

    const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    // .pipeTo(new WritableStream({
    //     write(chunk) {
    //         console.log("chunk", chunk);
    //     }
    // }))

    return reader;
}

function appendToHTML(element) {
    return new WritableStream({
        write({ title, description, url_anime }) {
            const newDescription = description === "" ? "No description." : description.slice(0, 100);

            const card = `
                <article class="rounded bg-zinc-800 p-8 rounded-md mb-4">
                    <div>
                        <strong class="block mb-2 text-xl">${title}</strong>
                        <p class="text-zinc-400 mb-4 text-ellipsis overflow-hidden">${newDescription}</p>
                        <a href="${url_anime}" class="text-violet-400 underline hover:brightness-110">Here's why</a>
                    </div>
                </article>
            `

            element.innerHTML += card;
        },

        // abort(reason) {
        //     console.log(``)
        // }
    })
}

function parseNDJSON() {
    let ndjsonBuffer = "";

    return new TransformStream({
        transform(chunk, controller) {
            ndjsonBuffer += chunk;

            const items = ndjsonBuffer.split("\n");

            items.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)));
        
            ndjsonBuffer = items[items.length - 1];
        },

        flush(controller) {
            if(!ndjsonBuffer) return

            controller.enqueue(JSON.parse(ndjsonBuffer));
        }
    })
}

const startFetchingButton = document.querySelector("button#startFetching");
const stopFetchingButton = document.querySelector("button#stopFetching");

const cardsContainer = document.querySelector("#cards");

startFetchingButton.addEventListener("click", async () => {
    const readable = await fetchAnimes(abortController.signal);
    
    readable.pipeTo(appendToHTML(cardsContainer))
})

let abortController = new AbortController();

stopFetchingButton.addEventListener("click", () => {
    abortController.abort();

    abortController = new AbortController();
})
