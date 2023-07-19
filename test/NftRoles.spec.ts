import hre, { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { randomHash } from './utils'

const { HashZero, AddressZero } = ethers.constants
const ONE_DAY = 60 * 60 * 24

describe('Nfts Roles', () => {
  let nftRoles: Contract

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let deployer: SignerWithAddress
  let roleCreator: SignerWithAddress
  let userOne: SignerWithAddress
  let userTwo: SignerWithAddress

  const role = randomHash()

  before(async function () {
    // prettier-ignore
    [deployer, roleCreator, userOne, userTwo] = await ethers.getSigners()
  })

  beforeEach(async () => {
    const NftRolesFactory = await ethers.getContractFactory('NftRoles')
    nftRoles = await NftRolesFactory.deploy()
  })

  describe('Nft Roles', async () => {
    let expirationDate: number
    const tokenId = 1
    const data = HashZero

    beforeEach(async () => {
      const blockNumber = await hre.ethers.provider.getBlockNumber()
      const block = await hre.ethers.provider.getBlock(blockNumber)
      expirationDate = block.timestamp + ONE_DAY
    })

    describe('Grant role', async () => {
      it('should grant role', async () => {
        await expect(
          nftRoles.connect(roleCreator).grantRole(role, userOne.address, AddressZero, tokenId, expirationDate, data),
        )
          .to.emit(nftRoles, 'RoleGranted')
          .withArgs(role, AddressZero, tokenId, userOne.address, expirationDate, data)
      })
      it('should NOT grant role if expiration date is in the past', async () => {
        const blockNumber = await hre.ethers.provider.getBlockNumber()
        const block = await hre.ethers.provider.getBlock(blockNumber)
        const expirationDateInThePast = block.timestamp - ONE_DAY

        await expect(
          nftRoles
            .connect(roleCreator)
            .grantRole(role, userOne.address, AddressZero, tokenId, expirationDateInThePast, HashZero),
        ).to.be.revertedWith('NftRoles: expiration date must be in the future')
      })
    })

    describe('Revoke role', async () => {
      it('should revoke role', async () => {
        await expect(nftRoles.connect(roleCreator).revokeRole(role, userOne.address, AddressZero, tokenId))
          .to.emit(nftRoles, 'RoleRevoked')
          .withArgs(role, AddressZero, tokenId, userOne.address)
      })
    })

    describe('Has role', async () => {
      beforeEach(async () => {
        await expect(
          nftRoles
            .connect(roleCreator)
            .grantRole(role, userOne.address, AddressZero, tokenId, expirationDate, HashZero),
        )
          .to.emit(nftRoles, 'RoleGranted')
          .withArgs(role, AddressZero, tokenId, userOne.address, expirationDate, HashZero)

        await expect(
          nftRoles
            .connect(roleCreator)
            .grantRole(role, userTwo.address, AddressZero, tokenId, expirationDate, HashZero),
        )
          .to.emit(nftRoles, 'RoleGranted')
          .withArgs(role, AddressZero, tokenId, userTwo.address, expirationDate, HashZero)
      })

      describe('Single User Roles', async () => {
        const supportMultipleUsers = false

        it('should return true for the last user granted, and false for the others', async () => {
          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userOne.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(false)

          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userTwo.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(true)
        })
        it('should NOT return true for the last user if role is expired', async () => {
          await hre.ethers.provider.send('evm_increaseTime', [ONE_DAY + 1])
          await hre.ethers.provider.send('evm_mine', [])

          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userOne.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(false)
        })
      })

      describe('Multiple Users Roles', async () => {
        const supportMultipleUsers = true

        it('should return true for all users', async () => {
          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userOne.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(true)

          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userTwo.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(true)
        })
        it("should NOT return true for all users if role is expired'", async () => {
          await hre.ethers.provider.send('evm_increaseTime', [ONE_DAY + 1])
          await hre.ethers.provider.send('evm_mine', [])

          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userOne.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(false)

          expect(
            await nftRoles.hasRole(
              role,
              roleCreator.address,
              userTwo.address,
              AddressZero,
              tokenId,
              supportMultipleUsers,
            ),
          ).to.be.equal(false)
        })
      })
    })

    describe('Role Data', async () => {
      it('should grant role with data', async () => {
        const customData = '0x1234'

        await expect(
          nftRoles
            .connect(roleCreator)
            .grantRole(role, userOne.address, AddressZero, tokenId, expirationDate, customData),
        )
          .to.emit(nftRoles, 'RoleGranted')
          .withArgs(role, AddressZero, tokenId, userOne.address, expirationDate, customData)

        const returnedData = await nftRoles.roleData(role, roleCreator.address, userOne.address, AddressZero, tokenId)

        expect(returnedData.data_).to.equal(customData)
      })
    })
  })
})
