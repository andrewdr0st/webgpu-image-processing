@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn tolinear(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let srgb = textureLoad(img_in, id.xy);
    let r = select(srgb.r / 12.92, pow((srgb.r + 0.055) / 1.055, 2.4), srgb.r > 0.04045);
    let g = select(srgb.g / 12.92, pow((srgb.g + 0.055) / 1.055, 2.4), srgb.g > 0.04045);
    let b = select(srgb.b / 12.92, pow((srgb.b + 0.055) / 1.055, 2.4), srgb.b > 0.04045);
    textureStore(img_out, id.xy, vec4f(r, g, b, srgb.a));
}