@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn grayscale(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let in = textureLoad(img_in, id.xy);
    let out = clamp(in.rgb + 0.1, vec3f(0.0), vec3f(1.0));
    textureStore(img_out, id.xy, vec4f(out, in.a));
}