import next from 'eslint-config-next'

const eslintConfig = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    // eslint-plugin-react-hooks v6 (bundled with Next 16) ships new
    // React-Compiler-era rules that, as errors, flag several idiomatic and
    // correct patterns used here — e.g. a capitalized local holding a Lucide
    // component resolved from a static map (`static-components`), the canonical
    // "latest callback in a ref" pattern (`refs`), and `setState`/loading flags
    // inside a data-fetching effect (`set-state-in-effect`). They're kept on as
    // warnings so they stay visible without failing the build on non-bugs.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]

export default eslintConfig
