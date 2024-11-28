import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import type { VectorStore } from "@langchain/core/vectorstores";

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

    let SYSTEM_TEMPLATE = "You are a friendly assistant. Ensure responses are coherent and make complete sense in the language used. If you don't know something or are unfamiliar, please don't make anything up, just say that you don't know."

    if (documentKey) {
        SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
        If you don't know the answer, just say that you don't know, don't try to make up an answer.
        ----------------
        {context}`;
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

    const chainInput = { input: inputText };

    const res = await chain.invoke(chainInput);
    const storeRes = await memory.saveContext(chainInput, {
        output: res,
    });

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
    const ids = [];
    const encoder = new TextEncoder();
    for (const doc of docs) {
        doc.metadata = { ...doc.metadata, filename }

        console.log(doc.metadata);

        const insecureHash = await crypto.subtle.digest(
            "SHA-1",
            encoder.encode(doc.pageContent),
        );
        // Use a hash of the page content as an id
        const hashArray = Array.from(new Uint8Array(insecureHash));
        const readableId = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        ids.push(readableId);
    }
    const result = await vectorstore.addDocuments(docs, { ids });
    return result;
};