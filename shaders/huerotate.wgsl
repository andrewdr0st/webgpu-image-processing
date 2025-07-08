struct valueStruct {
    amount: f32,
    dx: f32,
    dy: f32
}

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

const okLabToLms = mat3x3f(
    1, 1, 1,
    0.3963377774, -0.1055613458, -0.0894841775,
    0.2158037573, -0.0638541728, -1.2914855480
);

const lmsToRgb = mat3x3f(
    4.0767416621, -1.2684380046, -0.0041960863,
    -3.3077115913, 2.6097574011, -0.7034186147,
    0.2309699292, -0.3413193965, 1.7076147010
);

const PI = 3.14159265359;

@group(0) @binding(0) var img_in: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var img_out: texture_storage_2d<rgba8unorm, write>;
@group(1) @binding(0) var<uniform> values: valueStruct;

@compute @workgroup_size(8, 8, 1) fn huerotate(@builtin(global_invocation_id) id: vec3u) {
    let max_x = textureDimensions(img_in).x;
    let max_y = textureDimensions(img_in).y;
    if (id.x > max_x || id.y > max_y) {
        return;
    }

    let in = textureLoad(img_in, id.xy);
    
    var lch = okLabToLch(rgbToOKLab(in.rgb));

    lch.z += values.amount * (PI / 180);

    let out = okLabToRgb(lchToOKLab(lch));

    textureStore(img_out, id.xy, vec4f(out, 1));
}

fn rgbToOKLab(rgb: vec3f) -> vec3f {
    let lms = rgbToLms * rgb;
    let lms_ = pow(lms, vec3f(0.33333));
    return lmsToOKLab * lms_;
}

fn okLabToRgb(oklab: vec3f) -> vec3f {
    let lms_ = okLabToLms * oklab;
    let lms = pow(lms_, vec3f(3));
    return lmsToRgb * lms;
}

fn okLabToLch(oklab: vec3f) -> vec3f {
    let c = sqrt(oklab.y * oklab.y + oklab.z * oklab.z);
    let h = atan2(oklab.z, oklab.y);
    return vec3f(oklab.x, c, h);
}

fn lchToOKLab(lch: vec3f) -> vec3f {
    let a = lch.y * cos(lch.z);
    let b = lch.y * sin(lch.z);
    return vec3f(lch.x, a, b);
}
