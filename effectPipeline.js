class EffectPipeline {
    constructor(name, useValues = true) {
        this.name = name;
        this.pipeline;
        this.useValues = useValues;
    }

    async buildPipeline() {
        return loadWGSLShader(this.name + ".wgsl").then(shader => {
            const module = device.createShaderModule({
                label: this.name + " module",
                code: shader
            });
            const pipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: this.useValues ? [processLayout, valueLayout] : [processLayout]
            });
            this.pipeline = device.createComputePipeline({
                layout: this.name + " pipeline",
                layout: pipelineLayout,
                compute: {module: module}
            });
        });
    }

    run(encoder, textureBindGroup, valuesBindGroup) {
        const pass = encoder.beginComputePass({ label: this.name + " pass" });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, textureBindGroup);
        if (this.useValues) {
            pass.setBindGroup(1, valuesBindGroup);
        }
        pass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.height / 8));
        pass.end();
    }
}