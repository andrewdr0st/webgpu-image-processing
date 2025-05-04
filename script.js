let adapter;
let device;

let inputTexture;
let outputTexture;
let originalTexture;
let compTexture1;
let compTexture2;

let processLayout;

let compBG1;
let compBG2;

let grayscalePipeline;
let sobelPipeline;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('webgpu');

async function loadWGSLShader(path) {
    let response = await fetch(path);
    return await response.text();
}

async function loadImage(path) {
    const response = await fetch(path);
    const blob = await response.blob();
    return await createImageBitmap(blob);
}

async function setupGPUDevice() {
    adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
    if (!device) {
        alert('need a browser that supports WebGPU');
        return false;
    }

    let img = await loadImage("squirrel.jpg");
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.configure({
        device,
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
    });
    outputTexture = ctx.getCurrentTexture();

    compTexture1 = device.createTexture({
        size: {width: canvas.width, height: canvas.height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    compTexture2 = device.createTexture({
        size: {width: canvas.width, height: canvas.height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    processLayout = device.createBindGroupLayout({
        label: this.name + " layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm", access: "read-only" }
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm" }
            }
        ]
    });

    compBG1 = device.createBindGroup({
        label: "1 -> 2 bind group",
        layout: processLayout,
        entries: [
            { binding: 0, resource: compTexture1.createView() },
            { binding: 1, resource: compTexture2.createView() }
        ]
    });
    compBG2 = device.createBindGroup({
        label: "1 -> 2 bind group",
        layout: processLayout,
        entries: [
            { binding: 0, resource: compTexture2.createView() },
            { binding: 1, resource: compTexture1.createView() }
        ]
    });

    device.queue.copyExternalImageToTexture({source: img}, {texture: compTexture1}, [img.width, img.height]);

    grayscalePipeline = new EffectPipeline("grayscale");
    sobelPipeline = new EffectPipeline("sobel");
    await grayscalePipeline.buildPipeline();
    await sobelPipeline.buildPipeline();
}

async function processImage() {
    await setupGPUDevice();

    const encoder = device.createCommandEncoder({ label: "processing encoder" });

    grayscalePipeline.run(encoder, compBG1);

    sobelPipeline.run(encoder, compBG2);
    
    encoder.copyTextureToTexture({texture: compTexture1}, {texture: outputTexture}, {width: canvas.width, height: canvas.height});

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
}

processImage();
