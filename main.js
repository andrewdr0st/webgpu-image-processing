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

const effectList = [];
const linearPipeline = new EffectPipeline("tolinear");
const srgbPipeline = new EffectPipeline("tosrgb");

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

    const grayscalePipeline = new EffectPipeline("grayscale");
    const sobelPipeline = new EffectPipeline("sobel");
    const brightnessPipeline = new EffectPipeline("brightness");
    const contrastPipeline = new EffectPipeline("contrast", 1);
    const exposurePipeline = new EffectPipeline("exposure");
    const saturationPipeline = new EffectPipeline("saturation", 1);
    const temperaturePipeline = new EffectPipeline("temperature");
    const blurPipeline = new EffectPipeline("blur");
    const tintPipeline = new EffectPipeline("tint", 1);
    await Promise.all([
        linearPipeline.buildPipeline(),
        srgbPipeline.buildPipeline(),
        grayscalePipeline.buildPipeline(),
        sobelPipeline.buildPipeline(),
        brightnessPipeline.buildPipeline(),
        contrastPipeline.buildPipeline(),
        exposurePipeline.buildPipeline(),
        saturationPipeline.buildPipeline(),
        temperaturePipeline.buildPipeline(),
        blurPipeline.buildPipeline(),
        tintPipeline.buildPipeline()
    ]);
    brightnessPipeline.setValues(-0.1);
    contrastPipeline.setValues(1.2);
    exposurePipeline.setValues(1);
    saturationPipeline.setValues(1.5);
    temperaturePipeline.setValues(0, -0.3, -0.2);
    tintPipeline.setColor(0.9, 0.1, 0.35);

    //effectList.push(temperaturePipeline);
    //effectList.push(saturationPipeline);
    //effectList.push(contrastPipeline);
    //effectList.push(blurPipeline);
    //effectList.push(grayscalePipeline);
    //effectList.push(sobelPipeline);
    //effectList.push(blurPipeline);
    effectList.push(tintPipeline);
    effectList.push(brightnessPipeline);
}

function processImage() {
    const outputTexture = ctx.getCurrentTexture();
    curBG1 = false;

    const encoder = device.createCommandEncoder({ label: "Processing encoder" });

    linearPipeline.run(encoder, getBindGroup());

    for (let i = 0; i < effectList.length; i++) {
        effectList[i].run(encoder, getBindGroup());
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

    device.queue.copyExternalImageToTexture({source: img}, {texture: compTexture1}, [img.width, img.height]);
}

async function importImage(event) {
    const imgFile = event.target.files[0];
    if (!imgFile) return;
    console.log(imgFile.name);
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

async function init() {
    await setupGPUDevice();
    createEffectBoxes();
    processImage();
}

init();

importButton.addEventListener("change", importImage);

/*
effectListContainer.addEventListener("click", e => {
    console.log(e.target.dataset.id);
});
*/
