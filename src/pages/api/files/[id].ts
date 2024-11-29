import type { APIContext } from "astro";

export async function DELETE({ params, locals }: APIContext) {
    const { R2_BUCKET, AI, VECTORIZE } = locals.runtime.env;

    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }

    await R2_BUCKET.delete(id);


    const { data } = await AI.run("@cf/baai/bge-base-en-v1.5", {
        text: ["deleting data"],
    });

    const values = data[0];

    let matches = await VECTORIZE.query(values, {
        topK: 100,
        filter: { filename: id },
    });

    console.log(`Found ${matches.count} match(es) for file: ${id}`);

    const ids = matches.matches.map((m) => m.id)
    const result = await VECTORIZE.deleteByIds(ids);

    return new Response("success", {
        status: 200,
        headers: { "Content-Type": "application/text" },
    });

}
