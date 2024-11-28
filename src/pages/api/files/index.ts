import type { APIContext } from "astro";
import { ingestPdf } from "../../../../utils/ai";

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

            await ingestPdf(file, locals);
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

export async function GET({ locals }: APIContext) {
    const { R2_BUCKET } = locals.runtime.env;

    // Fetch the list of files from the R2 bucket
    const result = await R2_BUCKET.list();

    // Extract the files or objects from the result
    const files = result.objects?.map((object) => ({
        key: object.key, // File key (path in the bucket)
        size: object.size, // File size in bytes
        lastModified: object.uploaded, // Last modified date
    }));

    return new Response(JSON.stringify(files), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}