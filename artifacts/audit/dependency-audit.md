# Dependency audit

| Check | Status | Detail |
| --- | --- | --- |
| lockfile version | pass | 3 |
| application version parity | pass | 1.0.0 / 1.0.0 / 1.0.0 |
| root dependencies locked | pass | 42 dependencies |
| registry integrity hashes | pass | complete |
| forbidden network dependencies | pass | none |
| supported runtime | pass | >=24.0.0 <25 |
| browser acceptance runner | pass | 1.61.1 |

The advisory database gate runs in CI because it requires the npm registry.
