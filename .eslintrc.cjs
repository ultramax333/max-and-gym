module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: {jsx: true}},
    plugins: ['@typescript-eslint', 'react-hooks'],
    env: {browser: true, es2022: true, node: true},
    rules: {
        'no-console': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        '@typescript-eslint/no-explicit-any': 'error'
    },
    ignorePatterns: ['build', 'node_modules', 'artifacts']
};
