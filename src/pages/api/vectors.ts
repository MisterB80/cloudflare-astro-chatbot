import type { APIContext } from "astro";
import { deleteVectors } from "../../../utils/ai";


export async function GET({ locals }: APIContext) {

    deleteVectors(locals);

    return new Response("Deleted", {
        status: 200,
        headers: { "Content-Type": "application/text" },
    });
}