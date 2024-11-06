const sobel_x = mat3x3f(1, 2, 1, 0, 0, 0, -1, -2, -1);
const sobel_y = mat3x3f(1, 0, -1, 2, 0, -2, 1, 0, -1);

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn sobel(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }
    
    var sx: f32 = 0;
    var sy: f32 = 0;
    var x: i32;
    var y: i32;

    for (x = -1; x <= 1; x++) {
        for (y = -1; y <= 1; y++) {
            let p = vec2i(clamp(id.x + x, 0, max_x - 1), clamp(id.y + y, 0, max_y - 1));
            let c = textureLoad(img_in, p);
            sx += (c * sobel_x[x + 1][y + 1]).r;
            sy += (c * sobel_y[x + 1][y + 1]).r;
        }
    }

    let out = sqrt(sx * sx + sy * sy);

    textureStore(img_out, id.xy, vec4f(out, out, out, 1));
}