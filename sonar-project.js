
const sonarqubeScanner = require('sonarqube-scanner');

sonarqubeScanner(
  {
    serverUrl: 'https://sonarqube.global-desk.top',
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar.projectName': 'USMM',
      'sonar.projectKey': 'usmm',
      'sonar.sources': 'src',
      'sonar.tests': 'tests',
      'sonar.test.inclusions': 'tests/**/*.ts',
      'sonar.exclusions': 'node_modules/**,dist/**',
      'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info'
    },
  },
  () => process.exit()
);
