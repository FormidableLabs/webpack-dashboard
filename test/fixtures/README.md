## Test Fixtures

Additional `devDependencies` for tests. Mainly, we bring in `inspectpack` from tagged git release to get the `test/fixtures` directory.

After a root-level:

```sh
$ yarn install
```

The `inspectpack` fixtures will reside at: `node_modules/webpack-dashboard-test-fixtures/node_modules/inspectpack/test/fixtures/`. (By contrast, the root-level `node_modules/inspectpack` is the real, from-npm dependend-on one.)
