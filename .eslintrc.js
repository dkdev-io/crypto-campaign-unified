module.exports = {
  "extends": ["eslint:recommended", "plugin:react/recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "plugins": ["react"],
  "rules": {
    // DISABLE ALL AUTO-FIX RULES TO PRESERVE STYLING
    "indent": "off",
    "quotes": "off", 
    "semi": "off",
    "comma-dangle": "off",
    "object-curly-spacing": "off",
    "array-bracket-spacing": "off",
    "space-before-blocks": "off",
    "keyword-spacing": "off",
    "space-infix-ops": "off",
    "no-trailing-spaces": "off",
    "eol-last": "off",
    "no-multiple-empty-lines": "off",
    "padded-blocks": "off",
    "comma-spacing": "off",
    "key-spacing": "off",
    "space-before-function-paren": "off",
    "brace-style": "off",
    "curly": "off",
    "no-multi-spaces": "off",
    "space-in-parens": "off",
    "computed-property-spacing": "off",
    "func-call-spacing": "off",
    "no-whitespace-before-property": "off",
    "semi-spacing": "off",
    "block-spacing": "off",
    "object-property-newline": "off",
    "object-curly-newline": "off",
    "array-bracket-newline": "off",
    "array-element-newline": "off",
    "function-paren-newline": "off",
    "implicit-arrow-linebreak": "off",
    "linebreak-style": "off",
    "newline-before-return": "off",
    "newline-after-var": "off",
    "one-var-declaration-per-line": "off",
    "operator-linebreak": "off",
    "padded-blocks": "off",
    "quote-props": "off",
    "semi-style": "off",
    "space-unary-ops": "off",
    "switch-colon-spacing": "off",
    "template-curly-spacing": "off",
    "template-tag-spacing": "off",
    "unicode-bom": "off",
    "wrap-regex": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
};