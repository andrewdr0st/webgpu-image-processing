let adapter;
let device;

let inputTexture;
let outputTexture;
let originalTexture;

let grayscalePipeline;
let grayscaleLayout;
let grayscaleBindGroup;

let sobelPipeline;
let sobelLayout;
let sobelBindGroup;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tempCanvas = document.createElement('canvas');

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
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;

    const canvasContex = tempCanvas.getContext("webgpu");
    canvasContex.configure({
        device,
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
    });
    outputTexture = canvasContex.getCurrentTexture();

    inputTexture = device.createTexture({
        size: {width: canvas.width, height: canvas.height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    originalTexture = device.createTexture({
        size: {width: canvas.width, height: canvas.height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture({source: img}, {texture: inputTexture}, [img.width, img.height]);
    device.queue.copyExternalImageToTexture({source: img}, {texture: originalTexture}, [img.width, img.height]);

    grayscaleLayout = device.createBindGroupLayout({
        label: "Grayscale layout",
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
    let grayscaleCode = await loadWGSLShader("grayscale.wgsl")
    const grayscaleModule = device.createShaderModule({
        label: "Grayscale module",
        code: grayscaleCode
    });
    const grayscalePipelineLayout = device.createPipelineLayout({
        label: "Grayscale pipeline layout",
        bindGroupLayouts: [
            grayscaleLayout
        ]
    });
    grayscalePipeline = device.createComputePipeline({
        label: "Grayscale pipeline",
        layout: grayscalePipelineLayout,
        compute: {
            module: grayscaleModule
        }
    });
    grayscaleBindGroup = device.createBindGroup({
        label: "Grayscale bind group",
        layout: grayscaleLayout,
        entries: [
            { binding: 0, resource: inputTexture.createView() },
            { binding: 1, resource: outputTexture.createView() }
        ]
    });

    sobelLayout = device.createBindGroupLayout({
        label: "Sobel layout",
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm", access: "read-only" }
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm" }
            }, {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm", access: "read-only" }
            }
        ]
    });
    let sobelCode = await loadWGSLShader("sobel.wgsl")
    const sobelModule = device.createShaderModule({
        label: "Sobel module",
        code: sobelCode
    });
    const sobelPipelineLayout = device.createPipelineLayout({
        label: "Sobel pipeline layout",
        bindGroupLayouts: [
            sobelLayout
        ]
    });
    sobelPipeline = device.createComputePipeline({
        label: "Sobel pipeline",
        layout: sobelPipelineLayout,
        compute: {
            module: sobelModule
        }
    });
    sobelBindGroup = device.createBindGroup({
        label: "Sobel bind group",
        layout: sobelLayout,
        entries: [
            { binding: 0, resource: inputTexture.createView() },
            { binding: 1, resource: outputTexture.createView() },
            { binding: 2, resource: originalTexture.createView() }
        ]
    });


}

async function processImage() {
    await setupGPUDevice();

    const encoder = device.createCommandEncoder({ label: "processing encoder" });

    const pass = encoder.beginComputePass({ label: "grayscale pass" });

    pass.setPipeline(grayscalePipeline);
    pass.setBindGroup(0, grayscaleBindGroup);
    pass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.width / 8));

    pass.end();

    encoder.copyTextureToTexture({texture: outputTexture}, {texture: inputTexture}, {width: canvas.width, height: canvas.height});

    const sobelPass = encoder.beginComputePass({ label: "sobel pass" });

    sobelPass.setPipeline(sobelPipeline);
    sobelPass.setBindGroup(0, sobelBindGroup);
    sobelPass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.width / 8));

    sobelPass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
}

processImage();
