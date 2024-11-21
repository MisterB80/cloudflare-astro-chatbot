import type { APIContext } from "astro";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { exchangeSummary, chatHistory } from "../../schema";


type Request = {
  text: string;
}

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json() as Request;

  const conversationId = "testId";

  const { AI, DB } = locals.runtime.env;

  const db = drizzle(DB);

  const conversation = await db.select()
    .from(chatHistory)
    .where(eq(chatHistory.conversationId, conversationId))
    .orderBy(desc(chatHistory.created))
    .limit(10);

  const mappedMessages = conversation.reverse().map((message: { agent: string; text: string }) => {
    return {
      role: message.agent === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
      content: message.text,
    };
  });

  let messages: RoleScopedChatInput[] = [
    { role: "system", content: "You are a friendly assistant" },
    ...mappedMessages,
    { role: "user", content: payload.text },
  ];

  //@ts-expect-error
  const response = await AI.run("@cf/meta/llama-3.2-3b-instruct", { messages }) as AiTextGenerationOutput;

  // messages = [
  //   { role: "system", content: "You are a summarisation bot that needs to extract key points and/or facts from the following exchange." },
  //   { role: "user", content: payload.text },
  //   { role: "assistant", content: (response as any).response },
  // ];

  // //@ts-expect-error
  // const summary = await AI.run("@cf/meta/llama-3.2-3b-instruct", { messages }) as AiTextGenerationOutput;

  await db
    .insert(chatHistory)
    .values([
      { conversationId, agent: "user", text: payload.text },
      { conversationId, agent: "assistant", text: (response as any).response }
    ]);


  return Response.json(response);

};