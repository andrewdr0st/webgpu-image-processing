struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

const R = 0.2126;
const G = 0.7152;
const B = 0.0722;

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn saturation(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let ax = f32(id.x) / f32(max_x);
    let ay = f32(id.y) / f32(max_y);
    let dx = mix(-values.dx, values.dx, ax);
    let dy = mix(-values.dy, values.dy, ay);
    let amount = values.amount + dx + dy;

    let in = textureLoad(img_in, id.xy);
    let grayscale = dot(in.rgb, vec3f(R, G, B));
    let out = mix(vec3f(grayscale), in.rgb, amount);
    textureStore(img_out, id.xy, vec4f(out, in.a));
}