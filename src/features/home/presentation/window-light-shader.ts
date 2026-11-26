export const WINDOW_LIGHT_SHADER = `
uniform shader thr;
uniform shader cov;
uniform float litCode;
uniform float3 win;
uniform float3 haze;
uniform float hazeAlpha;
uniform float hazeTopPt;
half4 main(float2 xy) {
  float g = cov.eval(xy).r;
  if (g <= 0.0) return half4(0);
  float T = floor(thr.eval(xy).r * 255.0 + 0.5);
  if (T >= litCode) return half4(0);
  float3 c = (xy.y >= hazeTopPt) ? mix(win, haze, hazeAlpha) : win;
  return half4(c * g, g);
}
`;

export const RAMP_CALIBRATION_SHADER = `
uniform shader ramp;
half4 main(float2 xy) {
  float v = floor(ramp.eval(xy).r * 255.0 + 0.5);
  return abs(v - floor(xy.x)) < 0.5 ? half4(0, 1, 0, 1) : half4(1, 0, 0, 1);
}
`;
