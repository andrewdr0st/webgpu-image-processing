class EffectPipeline {
    constructor(name) {
        this.name = name;
        this.pipeline;
    }

    async buildPipeline() {
        return loadWGSLShader(this.name + ".wgsl").then(shader => {
            const module = device.createShaderModule({
                label: this.name + " module",
                code: shader
            });
            const pipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [
                    processLayout,
                    valueLayout
                ]
            });
            this.pipeline = device.createComputePipeline({
                layout: this.name + " pipeline",
                layout: pipelineLayout,
                compute: {
                    module: module
                }
            });
        });
    }

    run(encoder, textureBindGroup, valuesBindGroup) {
        device.queue.writeBuffer(this.buffer, 0, this.values);
        const pass = encoder.beginComputePass({ label: this.name + " pass" });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, textureBindGroup);
        pass.setBindGroup(1, valuesBindGroup);
        pass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.height / 8));
        pass.end();
    }
}