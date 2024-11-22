import type { APIContext } from "astro";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { exchangeSummary, chatHistory } from "../../schema";

import {
  ChatCloudflareWorkersAI,
  CloudflareVectorizeStore,
  CloudflareWorkersAIEmbeddings,
} from "@langchain/cloudflare";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { HttpResponseOutputParser } from "langchain/output_parsers";

type Request = {
  text: string;
}

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json() as Request;

  const conversationId = "testId";

  const { AI, DB, VECTORIZE, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = locals.runtime.env;

  const llm = new ChatCloudflareWorkersAI({
    model: "@cf/meta/llama-3-8b-instruct",
    cloudflareAccountId: CLOUDFLARE_ACCOUNT_ID,
    cloudflareApiToken: CLOUDFLARE_API_TOKEN,
  });

  const aiMsg = await llm.invoke([
    [
      "system",
      "You are a friendly assistant. Ensure responses are coherent and make complete sense in the language used. If you don't know something or are unfamiliar, please don't make anything up, just say that you don't know.",
    ],
    ["human", payload.text],
  ]);
  aiMsg;

  return Response.json(aiMsg.content);

};