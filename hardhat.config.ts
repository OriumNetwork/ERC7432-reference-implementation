import 'solidity-coverage'
import 'hardhat-spdx-license-identifier'
import '@nomicfoundation/hardhat-toolbox'

module.exports = {
  solidity: {
    version: '0.8.9',
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  mocha: {
    timeout: 840000,
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
}