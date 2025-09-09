// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

enable f16;

struct Uniforms {
  count: u32,
  category_count: u32,
  framebuffer_width: i32,
  framebuffer_height: i32,
  density_width: i32,
  density_height: i32,
  gamma: f32,
  point_size: f32,
  point_alpha: f32,
  points_alpha: f32,
  density_scaler: f32,
  quantization_step: f32,
  density_alpha: f32,
  contours_alpha: f32,
  matrix: mat3x3<f32>,
  view_xy_scaler: vec2<f32>,
  kde_causal: vec4<f32>,
  kde_anticausal: vec4<f32>,
  kde_a: vec4<f32>,
  background_color: vec4<f32>,
  category_colors: array<vec4<f32>, 256>,
}

struct PointData {
  position: vec3<f32>,
  category: u32,
}

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) log1malpha: f32, // log(1 - alpha)
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(1) @binding(0) var<storage, read> x_buffer: array<f32>;
@group(1) @binding(1) var<storage, read> y_buffer: array<f32>;
@group(1) @binding(2) var<storage, read> category_buffer: array<u32>;

@group(2) @binding(0) var<storage, read_write> count_buffer: array<atomic<u32>>;
@group(2) @binding(1) var<storage, read_write> blur_buffer: array<f16>;
@group(2) @binding(2) var<storage, read_write> blur_swap_buffer: array<f16>;

@group(3) @binding(0) var framebuffer_sampler: sampler;
@group(3) @binding(1) var color_texture: texture_2d<f32>;
@group(3) @binding(2) var log1malpha_texture: texture_2d<f32>;

fn get_point(index: u32) -> PointData {
  var result: PointData;
  result.position = vec3(x_buffer[index], y_buffer[index], 1.0);
  if (uniforms.category_count > 1) {
    result.category = (category_buffer[index >> 2] >> ((index & 3) << 3)) & 0xff;
  } else {
    result.category = 0;
  }
  return result;
}

const ACCUMULATE_UNIT: u32 = 4096;

fn increment_count(x: i32, y: i32, category: u32, value: u32) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  if (x < 0 || x >= width || y < 0 || y >= height || category >= uniforms.category_count || value == 0) {
    return;
  }
  let offset = (y * width + x) + i32(category) * (width * height);
  atomicAdd(&count_buffer[offset], value);
}

@compute @workgroup_size(64, 1)
fn accumulate(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let index = id.y * 4096 + id.x; // 4096 = 64 * 64
  if (index >= uniforms.count) { return; }
  let point = get_point(index);
  let pos = uniforms.matrix * point.position;
  let x = (pos.x + 1.0) / 2.0 * f32(width) - 0.5;
  let y = (pos.y + 1.0) / 2.0 * f32(height) - 0.5;
  let ix = i32(x);
  let iy = i32(y);
  let tx = x - f32(ix);
  let ty = y - f32(iy);
  let w1: u32 = u32((1 - tx) * (1 - ty) * f32(ACCUMULATE_UNIT));
  let w2: u32 = u32(tx * (1 - ty) * f32(ACCUMULATE_UNIT));
  let w3: u32 = u32((1 - tx) * ty * f32(ACCUMULATE_UNIT));
  let w123 = w1 + w2 + w3;
  var w4: u32 = select(0, ACCUMULATE_UNIT - w123, w123 < ACCUMULATE_UNIT);
  increment_count(ix, iy, point.category, w1);
  increment_count(ix + 1, iy, point.category, w2);
  increment_count(ix, iy + 1, point.category, w3);
  increment_count(ix + 1, iy + 1, point.category, w4);
}

// Draw Discrete Points

struct PointsVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) dp: vec3<f32>,
  @location(1) color: vec4<f32>,
}

@vertex
fn points_vs(
  @builtin(instance_index) index: u32,
  @builtin(vertex_index) part: u32,
) -> PointsVertexOutput {
  let framebuffer_size = vec2(f32(uniforms.framebuffer_width), f32(uniforms.framebuffer_height));
  let alpha = uniforms.point_alpha * uniforms.points_alpha;
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  let point = get_point(index);
  let pos = uniforms.matrix * point.position;

  var out: PointsVertexOutput;
  out.position = vec4<f32>(pos.xy + dp * uniforms.point_size / framebuffer_size * 2.0, 0.0, 1.0);
  out.dp = vec3(dp, uniforms.point_size);
  out.color = uniforms.category_colors[point.category] * alpha;
  return out;
}

@fragment
fn points_fs(in: PointsVertexOutput) -> FragmentOutput {
  let r = length(in.dp.xy) * in.dp.z;
  let a = max(0.0, min(1.0, in.dp.z - r));
  var out: FragmentOutput;
  out.color = in.color * a;
  out.log1malpha = log(1 - out.color.a);
  return out;
}

// Draw Density Map

struct DrawDensityMapVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texture_coord: vec2<f32>,
}

@vertex
fn draw_density_map_vs(
  @builtin(vertex_index) part: u32,
) -> DrawDensityMapVertexOutput {
  let framebuffer_size = vec2(f32(uniforms.framebuffer_width), f32(uniforms.framebuffer_height));
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  var out: DrawDensityMapVertexOutput;
  out.position = vec4(dp, 0.0, 1.0);
  out.texture_coord = (vec2(dp.x, dp.y) + 1.0) / 2.0 * framebuffer_size;
  return out;
}

fn get_density_raw(x: i32, y: i32, category: u32) -> f32 {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let density_scaler = uniforms.density_scaler;
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return 0.0;
  }
  let offset = (y * width + x) + i32(category) * (width * height);
  return max(0.0, f32(blur_buffer[offset]) * density_scaler);
}

fn get_density(x: f32, y: f32, category: u32) -> f32 {
  let px = x / f32(uniforms.framebuffer_width) * f32(uniforms.density_width) - 0.5;
  let py = y / f32(uniforms.framebuffer_height) * f32(uniforms.density_height) - 0.5;
  let ix = i32(px);
  let iy = i32(py);
  let tx = px - f32(ix);
  let ty = py - f32(iy);
  let v00 = get_density_raw(ix, iy, category);
  let v10 = get_density_raw(ix + 1, iy, category);
  let v01 = get_density_raw(ix, iy + 1, category);
  let v11 = get_density_raw(ix + 1, iy + 1, category);
  return mix(mix(v00, v10, tx), mix(v01, v11, tx), ty);
}

fn get_density_quantized(x: f32, y: f32, category: u32) -> f32 {
  let v = get_density(x, y, category);
  return floor(clamp(v, 0, 1) / uniforms.quantization_step);
}

fn get_density_quantized_sobel(x: f32, y: f32, category: u32) -> vec2<f32> {
  let v11 = get_density_quantized(x - 1, y - 1, category);
  let v21 = get_density_quantized(x, y - 1, category);
  let v31 = get_density_quantized(x + 1, y - 1, category);
  let v12 = get_density_quantized(x - 1, y, category);
  let v22 = get_density_quantized(x, y, category);
  let v32 = get_density_quantized(x + 1, y, category);
  let v13 = get_density_quantized(x - 1, y + 1, category);
  let v23 = get_density_quantized(x, y + 1, category);
  let v33 = get_density_quantized(x + 1, y + 1, category);
  let gx = v11 + v12 * 2.0 + v13 - v31 - v32 * 2.0 - v33;
  let gy = v11 + v21 * 2.0 + v31 - v13 - v23 * 2.0 - v33;
  return vec2(gx, gy);
}

@fragment
fn draw_density_map_fs(in: DrawDensityMapVertexOutput) -> FragmentOutput {
  let px = in.texture_coord.x;
  let py = in.texture_coord.y;
  let quantization_step: f32 = uniforms.quantization_step;

  var sum_color: vec4<f32> = vec4(0);
  var sum_log1malpha: f32 = 0.0;

  for (var i: u32 = 0; i < uniforms.category_count; i++) {
    let density = get_density(px, py, i);
    var alpha = min(1.0, floor(density / quantization_step) * quantization_step);
    alpha *= uniforms.density_alpha;
    let color = uniforms.category_colors[i] * alpha;
    sum_color += color;
    sum_log1malpha += log(1 - color.a);
  }

  if (uniforms.contours_alpha > 0.0) {
    for (var i: u32 = 0; i < uniforms.category_count; i++) {
      let sobel = get_density_quantized_sobel(px, py, i);
      let alpha = clamp(length(sobel) * 0.2, 0.0, 1.0) * uniforms.contours_alpha;
      let color = uniforms.category_colors[i] * alpha;
      sum_color += color;
      sum_log1malpha += log(1 - color.a);
    }
  }

  var out: FragmentOutput;
  out.color = sum_color;
  out.log1malpha = sum_log1malpha;
  return out;
}

// Gamma Correction

struct GammaCorrectionVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texture_coord: vec2<f32>,
}

@vertex
fn gamma_correction_vs(
  @builtin(vertex_index) part: u32,
) -> GammaCorrectionVertexOutput {
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  var out: GammaCorrectionVertexOutput;
  out.position = vec4(dp * uniforms.view_xy_scaler, 0.0, 1.0);
  out.texture_coord = (vec2(dp.x, -dp.y) + 1.0) / 2.0;
  return out;
}

@fragment
fn gamma_correction_fs(in: GammaCorrectionVertexOutput) -> @location(0) vec4<f32> {
  let sum_color = textureSample(color_texture, framebuffer_sampler, in.texture_coord);
  let sum_log_one_minus_alpha = textureSample(log1malpha_texture, framebuffer_sampler, in.texture_coord).r;
  var color: vec4<f32>;
  if (sum_color.a > 0.0) {
    color = sum_color / sum_color.a * (1.0 - exp(sum_log_one_minus_alpha));
    color = color + uniforms.background_color * (1 - color.a);
  } else {
    color = uniforms.background_color;
  }
  let rgb = pow(color.rgb, vec3(1.0 / uniforms.gamma));
  return vec4(rgb, 1.0);
}

// Gaussian Blur

@compute @workgroup_size(64, 1)
fn gaussian_blur_stage_1(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let x = id.x;
  if (x >= u32(width)) { return; }
  let start = x + id.y * u32(width * height);
  let count = u32(height);
  let stride = u32(width);

  deriche_conv_1d(
    &blur_buffer, &blur_swap_buffer, start, stride, count,
    uniforms.kde_causal, uniforms.kde_anticausal, uniforms.kde_a,
    true
  );
}

@compute @workgroup_size(64, 1)
fn gaussian_blur_stage_2(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let y = id.x;
  if (y >= u32(height)) { return; }
  let start = y * u32(width) + id.y * u32(width * height);
  let count = u32(width);
  let stride = u32(1);

  deriche_conv_1d(
    &blur_swap_buffer, &blur_buffer, start, stride, count,
    uniforms.kde_causal, uniforms.kde_anticausal, uniforms.kde_a,
    false
  );
}

fn deriche_conv_1d(
    src: ptr<storage, array<f16>, read_write>,
    dst: ptr<storage, array<f16>, read_write>,
    start: u32, stride: u32, count: u32,
    kde_causal: vec4<f32>, kde_anticausal: vec4<f32>, kde_a: vec4<f32>,
    src_is_u32: bool
) {
  var s: vec4<f32> = vec4(0.0);
  var y0: f32 = 0.0;
  var y1234: vec4<f32> = vec4(0.0);

  var first_nonzero: u32 = count;
  var last_nonzero: u32 = 0;

  for (var i: u32 = 0; i < count; i++) {
    let offset = start + i * stride;
    var input: f32;
    if (src_is_u32) {
      input = f32(bitcast<u32>(vec2((*src)[offset * 2], (*src)[offset * 2 + 1]))) / f32(ACCUMULATE_UNIT);
    } else {
      input = f32((*src)[offset]);
    }
    if (input != 0.0) {
      first_nonzero = min(i, first_nonzero);
      last_nonzero = max(i, last_nonzero);
    }
    s = vec4(input, s.xyz);
    y1234 = vec4(y0, y1234.xyz);
    y0 = dot(kde_causal, s) - dot(kde_a, y1234);
    (*dst)[offset] = f16(y0);
  }

  if (first_nonzero > last_nonzero) {
    return;
  }

  s = vec4(0.0);
  y0 = 0.0;
  y1234 = vec4(0.0);

  for (var i: u32 = count - 1 - last_nonzero; i < count; i++) {
    let p = count - 1 - i;
    let offset = start + p * stride;
    var input: f32 = 0.0;
    if (p >= first_nonzero) {
      if (src_is_u32) {
        input = f32(bitcast<u32>(vec2((*src)[offset * 2], (*src)[offset * 2 + 1]))) / f32(ACCUMULATE_UNIT);
      } else {
        input = f32((*src)[offset]);
      }
    }
    y1234 = vec4(y0, y1234.xyz);
    y0 = dot(kde_anticausal, s) - dot(kde_a, y1234);
    s = vec4(input, s.xyz);
    if (y0 != 0.0) {
      (*dst)[offset] = f16(f32((*dst)[offset]) + y0);
    }
  }
}
