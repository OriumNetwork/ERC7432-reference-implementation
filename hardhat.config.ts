import 'solidity-coverage'
import 'hardhat-spdx-license-identifier'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'

module.exports = {
  solidity: {
    version: '0.8.9',
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  gasReporter: {
    enabled: true,
    excludeContracts: ['contracts/test'],
    gasPrice: 100,
    token: 'MATIC',
    currency: 'USD',
  },
  mocha: {
    timeout: 840000,
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
}
