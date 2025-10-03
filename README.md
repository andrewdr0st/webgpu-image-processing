# WebGPU Image Processing
https://andrewdr0st.github.io/webgpu-image-processing/

Image processing site that utilizes WebGPU for fast performance. Supports a variety of effects that can be modified and combined to your heart's content.

## Effects
Effects are defined in _effects.json_. Effects have the following parameters:

| Name           | Type    | Description                              |
|----------------|---------|------------------------------------------|
| `name`         | string  | Effect name                              |
| `shader`       | string  | Wgsl shader file that defines the effect |
| `useValue`     | boolean | True if the effect uses a value          |
| `defaultValue` | number  | Initial value for the effect             |
| `minValue`     | number  | Mininum value for the slider             |
| `maxValue`     | number  | Maximum value for the slider             |
| `stepAmount`   | number  | Step amount for the slider               |
| `useColor`     | boolean | True if the effect uses a color          |


## Effect Shaders
Each effect uses a wgsl compute shader. Shader files are located in `/shaders`.

Each compute shader processes an 8x8 section of the input texture and writes to the same location in the output texture. The compute pipeline uses two bind groups, one for storing the input and output textures, and the other for storing the effect's `valueStruct`. The `valueStruct` contains an `amount: f32` and `color: vec3f`, along with unused `dx: f32` and `dy: f32` for gradients.

An effect shader should look something like this:
```wgsl
struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32,
    color: vec3f
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn effect(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }
    let in = textureLoad(img_in, id.xy);
    // calculate out color
    textureStore(img_out, id.xy, vec4f(out, in.a));
}
```

It is assumend the input image is in sRBG. It is assumed that the input texture is in linear space when excecuting an effect shader.
