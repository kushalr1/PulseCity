const React = require('react');
const { View } = require('react-native');

const passthrough = ({ children, ...props }) => React.createElement(View, props, children);

module.exports = {
  Canvas: passthrough,
  FilterMode: { Nearest: 0 },
  Group: passthrough,
  Image: passthrough,
  ImageShader: passthrough,
  Rect: passthrough,
  Shader: passthrough,
  Skia: { RuntimeEffect: { Make: () => ({}) }, Data: { fromURI: async () => ({}) }, Image: { MakeImageFromEncoded: () => ({}) } },
  useImage: jest.fn((source) => (source ? {} : null)),
};
