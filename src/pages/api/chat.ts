import type { APIContext } from "astro";
import { v4 as uuidv4 } from "uuid";
import {
  ChatCloudflareWorkersAI,
  CloudflareVectorizeStore,
  CloudflareWorkersAIEmbeddings,
  CloudflareD1MessageHistory,
} from "@langchain/cloudflare";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { ConversationChain } from "langchain/chains"
import { BufferMemory } from "langchain/memory";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

type Request = {
  text: string;
}

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json() as Request;

  // const sessionId = uuidv4();
  const sessionId = "test-session";

  const { AI, DB, VECTORIZE, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = locals.runtime.env;

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
    ["system", "You are a friendly assistant. Ensure responses are coherent and make complete sense in the language used. If you don't know something or are unfamiliar, please don't make anything up, just say that you don't know."],
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

  const chainInput = { input: payload.text };

  const res = await chain.invoke(chainInput);
  const storeRes = await memory.saveContext(chainInput, {
    output: res,
  });

  return Response.json(res);

};