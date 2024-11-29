import type { APIContext } from "astro";
import { chat } from "../../../utils/ai";

type Request = {
  text: string;
  session: string;
  document: string;
}

export async function POST({ request, locals }: APIContext) {
  const payload = await request.json() as Request;

  const res = await chat(payload.text, payload.session, decodeURIComponent(payload.document), locals);

  return Response.json(res);

};