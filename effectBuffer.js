class EffectBuffer {
    constructor() {
        this.values = new Float32Array(8);
        this.setupBuffer();
    }

    setupBuffer() {
        this.buffer = device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.bindGroup = device.createBindGroup({
            layout: valueLayout,
            entries: [{binding: 0, resource: {buffer: this.buffer}}]
        });
    }

    writeValues() {
        device.queue.writeBuffer(this.buffer, 0, this.values);
    }

    setValues(amount, dx=0.0, dy=0.0) {
        this.values.set([amount, dx, dy]);
    }

    setColor(r, g, b) {
        this.values.set([r, g, b], 4);
    }
}