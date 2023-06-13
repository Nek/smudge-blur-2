vec2 uvScale (vec2 baseUv, float scale) {
    vec2 uv = baseUv;

    float s = 1. / scale;
    uv = uv * s - ( s - 1.) * 0.5;

    return uv;
}

vec2 uvScale (vec2 baseUv, vec2 scale) {
    vec2 uv = baseUv;

    float sx = 1. / scale.x;
    float sy = 1. / scale.y;
    uv.x = uv.x * sx - ( sx - 1.) * 0.5;
    uv.y = uv.y * sy - ( sy - 1.) * 0.5;

    return uv;
}