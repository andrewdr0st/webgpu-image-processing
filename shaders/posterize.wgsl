struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;
@group(1) @binding(1) var<uniform> pallete: array<vec3f, 32>;

@compute @workgroup_size(8, 8, 1) fn quantize(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }
    
    let in = textureLoad(img_in, id.xy);

    var dist = 10000.0;
    var p = 0;
    for (var i = 0; i < 32; i++) {
        let v = in.rgb - pow(pallete[i], vec3f(2.2));
        let d = v.x * v.x + v.y * v.y + v.z * v.z;
        if (d < dist) {
            dist = d;
            p = i;
        }
    }

    textureStore(img_out, id.xy, vec4f(pallete[p], in.a));
}