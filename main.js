let adapter;
let device;

let img;

let originalTexture;
let compTexture1;
let compTexture2;

let processLayout;
let valueLayout;

let initBG;
let compBG1;
let compBG2;

let allEffects;
const effectList = [];
const pipelineList = [];
const linearPipeline = new EffectPipeline("tolinear", false);
const srgbPipeline = new EffectPipeline("tosrgb", false);

const canvas = document.getElementById("processCanvas");
const ctx = canvas.getContext("webgpu");
const display = document.getElementById("displayCanvas");
const displayContainer = document.getElementById("displayContainer");
const displayCtx = display.getContext("2d");
const importButton = document.getElementById("importImage");
const effectListContainer = document.getElementById("effectList");

async function loadWGSLShader(path) {
    let response = await fetch("shaders/" + path);
    return await response.text();
}

async function loadImage(path) {
    const response = await fetch(path);
    const blob = await response.blob();
    return await createImageBitmap(blob);
}

async function loadJSON(path) {
    const response = await fetch(path);
    return response.json();
}

async function setupGPUDevice() {
    adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
    if (!device) {
        alert("need a browser that supports WebGPU");
        return false;
    }

    ctx.configure({
        device,
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
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

    img = await loadImage("squirrel.jpg");

    createImgTextures();

    allEffects = await loadJSON("effects.json");
    const pipelinePromises = [linearPipeline.buildPipeline(), srgbPipeline.buildPipeline()];

    for (let i = 0; i < allEffects.length; i++) {
        const effect = allEffects[i];
        const pipeline = new EffectPipeline(effect.shader);
        effect.pipeline = pipeline;
        pipelinePromises.push(pipeline.buildPipeline());
    }

    await Promise.all(pipelinePromises);

    addEffect(0);
    addEffect(6);
    addEffect(7);
    addEffect(5);

    return true;
}

function processImage() {
    const outputTexture = ctx.getCurrentTexture();
    curBG1 = false;

    const encoder = device.createCommandEncoder({ label: "Processing encoder" });

    linearPipeline.run(encoder, initBG);

    for (let i = 0; i < effectList.length; i++) {
        const effect = effectList[i];
        effect.buffer.writeValues();
        effect.pipeline.run(encoder, getBindGroup(), effect.buffer.bindGroup);
    }

    srgbPipeline.run(encoder, getBindGroup());

    let fTex = curBG1 ? compTexture2 : compTexture1;
    encoder.copyTextureToTexture({texture: fTex}, {texture: outputTexture}, {width: canvas.width, height: canvas.height});

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    copyImageToDisplay();
}

let curBG1 = false;
function getBindGroup() {
    curBG1 = !curBG1;
    return curBG1 ? compBG1 : compBG2;
}

function createImgTextures() {
    canvas.width = img.width;
    canvas.height = img.height;

    originalTexture = device.createTexture({
        size: {width: canvas.width, height: canvas.height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
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

    initBG = device.createBindGroup({
        label: "original -> 1 bind group",
        layout: processLayout,
        entries: [
            { binding: 0, resource: originalTexture.createView() },
            { binding: 1, resource: compTexture1.createView() }
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
        label: "2 -> 1 bind group",
        layout: processLayout,
        entries: [
            { binding: 0, resource: compTexture2.createView() },
            { binding: 1, resource: compTexture1.createView() }
        ]
    });

    device.queue.copyExternalImageToTexture({source: img}, {texture: originalTexture}, [img.width, img.height]);
}

async function importImage(event) {
    const imgFile = event.target.files[0];
    if (!imgFile) return;
    img = await createImageBitmap(imgFile);
    createImgTextures();
    processImage();
}

function copyImageToDisplay() {
    const wRatio = displayContainer.clientWidth / canvas.width;
    const hRatio = displayContainer.clientHeight / canvas.height;
    const minRatio = Math.min(wRatio, hRatio, 1);
    display.width = Math.floor(canvas.width * minRatio);
    display.height = Math.floor(canvas.height * minRatio);
    displayCtx.clearRect(0, 0, display.width, display.height);
    displayCtx.drawImage(canvas, 0, 0, display.width, display.height);
}

function addEffect(id) {
    const effect = {...allEffects[id]};
    effect.buffer = new EffectBuffer();
    if (effect.useValues) {
        effect.buffer.setValues(effect.defaultValue);
    }
    if (effect.useColor) {
        effect.buffer.setColor(1, 1, 1);
    }
    effectList.push(effect);
}

async function init() {
    const supportsWebGPU = await setupGPUDevice();
    if (supportsWebGPU) {
        for (let i = 0; i < effectList.length; i++) {
            createEffectBox(effectList[i]);
        }
        processImage();
    }
}

init();

importButton.addEventListener("change", importImage);

/*
effectListContainer.addEventListener("click", e => {
    console.log(e.target.dataset.id);
});
*/
