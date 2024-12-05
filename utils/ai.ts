import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";

import {
    ChatCloudflareWorkersAI,
    CloudflareVectorizeStore,
    CloudflareWorkersAIEmbeddings,
    CloudflareD1MessageHistory,
} from "@langchain/cloudflare";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function chat(inputText: string, sessionId: string, documentKey: string | null, locals: App.Locals): Promise<string> {

    const { DB, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = locals.runtime.env;

    const model = new ChatCloudflareWorkersAI({
        model: "@cf/meta/llama-3-8b-instruct",
        cloudflareAccountId: CLOUDFLARE_ACCOUNT_ID,
        cloudflareApiToken: CLOUDFLARE_API_TOKEN,
    });

    const memory = new BufferMemory({
        returnMessages: true,
        chatHistory: new CloudflareD1MessageHistory({
            tableName: "stored_messages",
            sessionId,
            database: DB,
        }),
    });

    let SYSTEM_TEMPLATE = "You are a helpful assistant. Ensure responses are coherent, concise and make complete sense in the language used. If you don't know something or are unfamiliar, please don't make anything up, just say that you don't know."
    let context = "";

    if (documentKey) {
        SYSTEM_TEMPLATE += `Use the following pieces of context to answer the question at the end.
        If you don't know the answer, just say that you don't know, don't try to make up an answer.
        ----------------`;

        SYSTEM_TEMPLATE += await getContext(inputText, documentKey, locals);
    }

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(SYSTEM_TEMPLATE),
        new MessagesPlaceholder("history"),
        ["human", "{input}"],
    ]);

    const chain = RunnableSequence.from([
        {
            input: (initialInput) => initialInput.input,
            memory: () => memory.loadMemoryVariables({}),
        },
        {
            input: (previousOutput) => previousOutput.input,
            history: (previousOutput) => previousOutput.memory.history,
        },
        prompt,
        model,
        new StringOutputParser(),
    ]);

    // const chainInput = context ? { input: inputText, context } : { input: inputText };
    const chainInput = { input: inputText };

    const res = await chain.invoke(chainInput);

    if (res) {
        const storeRes = await memory.saveContext(chainInput, {
            output: res,
        });
    }
    console.log(res);


    return res;
}

export async function ingestPdf(file: any, locals: App.Locals) {

    const { AI, VECTORIZE } = locals.runtime.env;

    const loader = new PDFLoader(file, {
        splitPages: false,
    });

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 0,
    });

    const embeddings = new CloudflareWorkersAIEmbeddings({
        //@ts-ignore
        binding: AI,
        modelName: "@cf/baai/bge-base-en-v1.5",
    });

    const store = new CloudflareVectorizeStore(embeddings, {
        index: VECTORIZE,
    });

    const pdfDocument = await loader.load();
    const docs = await textSplitter.splitDocuments(pdfDocument);
    const result = await upsertDocsToVectorstore(store, docs, file.name);
}

const upsertDocsToVectorstore = async (
    vectorstore: VectorStore,
    docs: Document[],
    filename: string
) => {
    const encoder = new TextEncoder();
    for (const doc of docs) {
        doc.metadata = { filename }

        const insecureHash = await crypto.subtle.digest(
            "SHA-1",
            encoder.encode(doc.pageContent),
        );
        // Use a hash of the page content as an id
        const hashArray = Array.from(new Uint8Array(insecureHash));
        const readableId = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        doc.id = readableId;
    }

    const result = await vectorstore.addDocuments(docs);

    console.log(result);

    return result;
};

export async function deleteVectors(locals: App.Locals) {
    const { AI, VECTORIZE } = locals.runtime.env;

    const { data } = await AI.run("@cf/baai/bge-base-en-v1.5", {
        text: ["delete"],
    });

    const values = data[0];

    let matches = await VECTORIZE.query(values, {
        topK: 100,
    });

    console.log(matches);

    const ids = matches.matches.map((m) => m.id)

    console.log(ids);

    const result = await VECTORIZE.deleteByIds(ids);

    console.log(result);



}


async function getContext(inputText: string, documentKey: string, locals: App.Locals): Promise<string> {
    const { AI, VECTORIZE } = locals.runtime.env;

    const { data } = await AI.run("@cf/baai/bge-base-en-v1.5", {
        text: [inputText],
    });

    const values = data[0];

    let matches = await VECTORIZE.query(values, {
        topK: 5,
        filter: { filename: documentKey },
        returnValues: true,
        returnMetadata: 'all',
    });

    const text = matches.matches.map((m) => m.metadata?.text).join("/n")

    return text;
}