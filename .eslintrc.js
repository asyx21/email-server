module.exports = {
  extends: ['airbnb'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['./src'],
      },
    },
  },
  parserOptions: {
    ecmaVersion: 8,
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    camelcase: 'off',
  },
};
