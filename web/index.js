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
            const card = `
                <article class="border rounded border-zinc-400">
                    <strong>[${++counter}] - ${title}</strong>
                    <p>${description}</p>
                    <a href="${url_anime}">Here's why</a>
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

const [
    start,
    stop,
    cards
] = ["start", "stop", "cards"].map(item => document.querySelector(`#${item}`));

start.addEventListener("click", async () => {
    const readable = await fetchAnimes(abortController.signal);
    
    readable.pipeTo(appendToHTML(cards))
})

let abortController = new AbortController();

stop.addEventListener("click", () => {
    abortController.abort();

    abortController = new AbortController();
})
