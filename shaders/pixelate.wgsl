struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn pixelate(@builtin(global_invocation_id) id: vec3u) {
    let tdim = textureDimensions(img_in);
    let max_x = tdim.x;
    let max_y = tdim.y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let idf = vec2f(f32(id.x), f32(id.y));
    let scalevec = vec2f(values.amount);
    let tpixelf = floor(idf / scalevec) * scalevec + floor((scalevec - vec2f(0.001)) / 2);
    let tpixel = min(vec2u(tpixelf), tdim - vec2u(1));
    
    let in = textureLoad(img_in, tpixel);
    textureStore(img_out, id.xy, in);
}