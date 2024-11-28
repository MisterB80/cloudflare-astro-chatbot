import { useState } from "react";

export default function FileUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const onUpload = (files: any) => {
        const event = new CustomEvent('onUpload', {
            detail: { filenames: Array.from(files) },
        });
        window.dispatchEvent(event);
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        onUpload(files);
    };


    return (
        <div>
            {showUpload && <div
                className={`flex items-center justify-center w-full h-96 ${isDragging ? 'border-primary' : 'border-base-300'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}>
                <label
                    htmlFor="dropzone-file"
                    className={"flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-base-100 hover:bg-neutral-content" + (isDragging && " bg-neutral-content")}>
                    <div className="flex flex-col items-center justify-center pt-10 pb-10">
                        <h1 className="text-xl font-semibold capitalize">{`upload files`}</h1>
                        <p className="mb-2 text-sm">
                            <span className="font-semibold">
                                {isDragging ? 'Drop here' : 'Click to upload '}
                            </span>
                            {isDragging ? '' : 'or drag files here.'}
                        </p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
            </div>}
            <div className="fixed bottom-4 right-4">
                <button className="btn btn-lg btn-accent btn-circle" onClick={() => setShowUpload(true)}> + </button>
            </div>

        </div>
    );
}