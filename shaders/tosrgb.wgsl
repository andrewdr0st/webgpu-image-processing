@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn tosrgb(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let linear = textureLoad(img_in, id.xy);
    let r = select(linear.r * 12.92, pow(linear.r, 0.4166667) * 1.055 - 0.055, linear.r > 0.0031308);
    let g = select(linear.g * 12.92, pow(linear.g, 0.4166667) * 1.055 - 0.055, linear.g > 0.0031308);
    let b = select(linear.b * 12.92, pow(linear.b, 0.4166667) * 1.055 - 0.055, linear.b > 0.0031308);
    textureStore(img_out, id.xy, vec4f(r, g, b, linear.a));
}