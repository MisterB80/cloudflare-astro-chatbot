import type { APIContext } from "astro";

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json();

  let messages: RoleScopedChatInput[] = [
    { role: "system", content: "You are a friendly assistant" },
    { role: "user", content: payload.text },
  ];

  const { AI } = locals.runtime.env;

  const response = await AI.run("@cf/meta/llama-3.2-1b-instruct", { messages });

  return Response.json(response);
  
};