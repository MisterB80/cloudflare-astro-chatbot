// import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
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
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { ConversationChain } from "langchain/chains"
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

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage("You are a friendly assistant. Ensure responses are coherent and make complete sense in the language used. If you don't know something or are unfamiliar, please don't make anything up, just say that you don't know."),
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