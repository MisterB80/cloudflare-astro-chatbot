import type { APIContext } from "astro";

export async function POST({ request, locals }: APIContext) {
    const { R2_BUCKET } = locals.runtime.env;

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    const uploadResults = [];

    for (const file of files) {
        try {
            // Upload each file to the R2 bucket
            const uploadResult = await R2_BUCKET.put(file.name, file);
            uploadResults.push({
                fileName: file.name,
                size: file.size,
                status: 'success',
                result: uploadResult,
            });
        } catch (error: any) {
            console.error(`Failed to upload file: ${file.name}`, error);
            uploadResults.push({
                fileName: file.name,
                size: file.size,
                status: 'error',
                error: error.message,
            });
        }
    }

    return new Response(JSON.stringify(uploadResults), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
