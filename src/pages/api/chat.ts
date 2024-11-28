import type { APIContext } from "astro";
import { v4 as uuidv4 } from "uuid";
import { chat } from "../../../utils/ai";

type Request = {
  text: string;
}

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json() as Request;

  // const sessionId = uuidv4();
  const sessionId = "test-session";

  const res = await chat(payload.text, sessionId, null, locals);

  return Response.json(res);

};