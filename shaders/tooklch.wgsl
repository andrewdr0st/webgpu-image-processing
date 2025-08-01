const rgbToLms = mat3x3f(
    0.4122214708, 0.2119034982, 0.0883024619,
    0.5363325363, 0.6806995451, 0.2817188376,
    0.0514459929, 0.1073969566, 0.6299787005
);

const lmsToOKLab = mat3x3f(
    0.2104542553, 1.9779984951, 0.0259040371,
    0.7936177850, -2.4285922050, 0.7827717662,
    -0.0040720468, 0.4505937099, -0.8086757660
);

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn tooklch(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let linear = textureLoad(img_in, id.xy);
    let oklch = okLabToLch(rgbToOKLab(linear.rgb));
    textureStore(img_out, id.xy, vec4f(oklch, linear.a));
}

fn rgbToOKLab(rgb: vec3f) -> vec3f {
    let lms = rgbToLms * rgb;
    let lms_ = pow(lms, vec3f(0.33333));
    return lmsToOKLab * lms_;
}

fn okLabToLch(oklab: vec3f) -> vec3f {
    let c = sqrt(oklab.y * oklab.y + oklab.z * oklab.z);
    let h = atan2(oklab.z, oklab.y);
    return vec3f(oklab.x, c, h);
}