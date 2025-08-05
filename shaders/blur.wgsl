struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn blur(@builtin(global_invocation_id) id: vec3u) {
    let max_x = i32(textureDimensions(img_in).x);
    let max_y = i32(textureDimensions(img_in).y);
    let ix = i32(id.x);
    let iy = i32(id.y);
    if (ix > max_x || iy > max_y) {
        return;
    }

    let size = i32(values.amount);
    let s = values.amount * 2 + 1;
    var totalc = vec4f(0, 0, 0, 0);
    var x: i32;
    var y: i32;

    for (x = -size; x <= size; x++) {
        for (y = -size; y <= size; y++) {
            let p = vec2i(clamp(ix + x, 0, max_x - 1), clamp(iy + y, 0, max_y - 1));
            let c = textureLoad(img_in, p);
            totalc += c;
        }
    }

    totalc /= s * s;

    textureStore(img_out, id.xy, totalc);
}