module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.spec.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
      '^@config/(.*)$': '<rootDir>/src/config/$1',
      '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
      '^@services/(.*)$': '<rootDir>/src/services/$1',
      '^@entities/(.*)$': '<rootDir>/src/entities/$1',
      '^@dto/(.*)$': '<rootDir>/src/dto/$1',
      '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
      '^@enums/(.*)$': '<rootDir>/src/enums/$1',
      '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
      '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/main.ts',
      '!src/**/*.module.ts',
      '!src/**/*.interface.ts',
      '!src/**/*.enum.ts',
      '!src/**/*.dto.ts',
      '!src/**/*.entity.ts',
    ],
    coverageDirectory: './coverage',
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  };