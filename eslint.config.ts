import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import perfectionist from 'eslint-plugin-perfectionist';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: { js, perfectionist, prettierPlugin },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.browser },
        rules: {
            'no-console': 1,
            semi: ['error', 'always'],
            'quote-props': ['error', 'as-needed'],
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            'perfectionist/sort-union-types': 'error',
        },
    },
    tseslint.configs.recommended,
    {
        ignores: ['dist/**/*', 'node_modules/**/*'],
    },
]);
