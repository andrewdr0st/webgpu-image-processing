let adapter;
let device;

let img;

let originalTexture;
let compTexture1;
let compTexture2;

let processLayout;
let valueLayout;

let compBG1;
let compBG2;

let grayscalePipeline;
let sobelPipeline;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('webgpu');

async function loadWGSLShader(path) {
    let response = await fetch("shaders/" + path);
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

    img = await loadImage("squirrel.jpg");
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.configure({
        device,
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
    });

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
        label: "process layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {format: "rgba8unorm", access: "read-only"}
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {format: "rgba8unorm"}
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

    valueLayout = device.createBindGroupLayout({
        label: "value layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: "uniform"}
            }
        ]
    });

    device.queue.copyExternalImageToTexture({source: img}, {texture: compTexture1}, [img.width, img.height]);

    linearPipeline = new EffectPipeline("tolinear");
    srgbPipeline = new EffectPipeline("tosrgb");
    grayscalePipeline = new EffectPipeline("grayscale");
    sobelPipeline = new EffectPipeline("sobel");
    brightnessPipeline = new EffectPipeline("brightness");
    contrastPipeline = new EffectPipeline("contrast", 1);
    exposurePipeline = new EffectPipeline("exposure");
    saturationPipeline = new EffectPipeline("saturation", 1);
    temperaturePipeline = new EffectPipeline("temperature");
    await Promise.all([
        linearPipeline.buildPipeline(),
        srgbPipeline.buildPipeline(),
        grayscalePipeline.buildPipeline(),
        sobelPipeline.buildPipeline(),
        brightnessPipeline.buildPipeline(),
        contrastPipeline.buildPipeline(),
        exposurePipeline.buildPipeline(),
        saturationPipeline.buildPipeline(),
        temperaturePipeline.buildPipeline()
    ]);
    brightnessPipeline.setValues(-0.1);
    contrastPipeline.setValues(1.2);
    exposurePipeline.setValues(1);
    saturationPipeline.setValues(1.5);
    temperaturePipeline.setValues(0, -0.3, -0.2);
}

async function processImage() {
    await setupGPUDevice();

    const outputTexture = ctx.getCurrentTexture();

    const encoder = device.createCommandEncoder({ label: "processing encoder" });

    linearPipeline.run(encoder, getBindGroup());
    temperaturePipeline.run(encoder, getBindGroup());
    saturationPipeline.run(encoder, getBindGroup());
    contrastPipeline.run(encoder, getBindGroup());
    srgbPipeline.run(encoder, getBindGroup());

    let fTex = curBG1 ? compTexture2 : compTexture1;
    encoder.copyTextureToTexture({texture: fTex}, {texture: outputTexture}, {width: canvas.width, height: canvas.height});

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
}

let curBG1 = false;
function getBindGroup() {
    curBG1 = !curBG1;
    return curBG1 ? compBG1 : compBG2;
}

processImage();
