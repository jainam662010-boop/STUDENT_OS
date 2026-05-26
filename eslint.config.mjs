import next from 'eslint-config-next'

const config = [
  ...next,
  {
    rules: {
      // React 19 Compiler rules — false positives for Zustand/ref patterns
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]

export default config
