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
                label: this.name + " pipeline layout",
                bindGroupLayouts: [
                    processLayout
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

    run(encoder, bindGroup) {
        const pass = encoder.beginComputePass({ label: this.name + " pass" });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.width / 8));
        pass.end();
    }
}