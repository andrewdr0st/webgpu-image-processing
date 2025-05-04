class EffectPipeline {
    constructor(name, defaultAmount=0) {
        this.name = name;
        this.pipeline;
        this.values = new Float32Array([defaultAmount, 0, 0]);
        this.buffer;
        this.bindGroup;
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
            this.buffer = device.createBuffer({
                label: "uniform buffer",
                size: 12,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            this.bindGroup = device.createBindGroup({
                label: "values bind group",
                layout: valueLayout,
                entries: [
                    {binding: 0, resource: {buffer: this.buffer}}
                ]
            });
        });
    }

    run(encoder, bindGroup) {
        device.queue.writeBuffer(this.buffer, 0, this.values);
        const pass = encoder.beginComputePass({ label: this.name + " pass" });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setBindGroup(1, this.bindGroup);
        pass.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.width / 8));
        pass.end();
    }

    setValues(amount, dx=0.0, dy=0.0) {
        this.values.set([amount, dx, dy]);
    }
}