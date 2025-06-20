const gaussian = mat3x3f

struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn blur(@builtin(global_invocation_id) id: vec3u) {

}