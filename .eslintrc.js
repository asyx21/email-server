module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['./src'],
      }
    }
  },
  parserOptions: {
    ecmaVersion: 6,
  },
  env: {
    es6: true,
    browser: true,
  },
  rules: {
    camelcase: 'off',
  },
};
