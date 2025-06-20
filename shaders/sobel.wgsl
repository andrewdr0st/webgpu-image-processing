const sobel_x = mat3x3f(1, 2, 1, 0, 0, 0, -1, -2, -1);
const sobel_y = mat3x3f(1, 0, -1, 2, 0, -2, 1, 0, -1);

struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn sobel(@builtin(global_invocation_id) id: vec3u) {
    let max_x = i32(textureDimensions(img_in).x);
    let max_y = i32(textureDimensions(img_in).y);
    let ix = i32(id.x);
    let iy = i32(id.y);
    if (ix > max_x || iy > max_y) {
        return;
    }
    
    var sx: f32 = 0;
    var sy: f32 = 0;
    var x: i32;
    var y: i32;

    for (x = -1; x <= 1; x++) {
        for (y = -1; y <= 1; y++) {
            let p = vec2i(clamp(ix + x, 0, max_x - 1), clamp(iy + y, 0, max_y - 1));
            let c = textureLoad(img_in, p);
            sx += (c * sobel_x[x + 1][y + 1]).r;
            sy += (c * sobel_y[x + 1][y + 1]).r;
        }
    }

    let out = sqrt(sx * sx + sy * sy);
    let finalc = vec4f(out, out, out, 1.0);
    textureStore(img_out, id.xy, finalc);
}