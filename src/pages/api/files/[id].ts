import type { APIContext } from "astro";

export async function DELETE({ params, locals }: APIContext) {
    const { R2_BUCKET } = locals.runtime.env;

    const { id } = params;

    console.log(id);

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }

    await R2_BUCKET.delete(id);

    return new Response("success", {
        status: 200,
        headers: { "Content-Type": "application/text" },
    });

}
