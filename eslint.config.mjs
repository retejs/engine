import tseslint from 'typescript-eslint';
import configs from 'rete-cli/configs/eslint.mjs';

export default tseslint.config(
  ...configs,
  {
    files: ['**/*.test.ts', '**/*.test-d.ts'],
    rules: {
      'eslint-disable': 'off',
      'init-declarations': 'off',
      'max-statements': 'off',
    }
  }
)