import hre, { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { randomHash } from './utils'

const { HashZero, AddressZero } = ethers.constants
const ONE_DAY = 60 * 60 * 24

describe('Nfts Roles Metadata', () => {
  let nftRolesMetadata: Contract

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let deployer: SignerWithAddress

  const role = randomHash()
  const name = 'role name'
  const description = 'role description'
  const data = randomHash()

  before(async function () {
    // prettier-ignore
    [deployer] = await ethers.getSigners()
  })

  beforeEach(async () => {
    const NftRolesMetadataFactory = await ethers.getContractFactory('NftRolesMetadata')
    nftRolesMetadata = await NftRolesMetadataFactory.deploy()
  })

  describe('Nft Roles', async () => {
    describe('Set role metadata', async () => {
      it('should set role metadata', async () => {
        await expect(nftRolesMetadata.setRole(role, name, description, data))
          .to.emit(nftRolesMetadata, 'RoleMetadata')
          .withArgs(role, name, description, data)
      })
    })

    describe('Get role metadata', async () => {
      beforeEach(async () => {
        await nftRolesMetadata.setRole(role, name, description, data)
      })
      it('should get role name', async () => {
        expect(await nftRolesMetadata.roleName(role)).to.equal(name)
      })
      it('should get role description', async () => {
        expect(await nftRolesMetadata.roleDescription(role)).to.equal(description)
      })
      it('should get role metadata', async () => {
        expect(await nftRolesMetadata.roleMetadata(role)).to.equal(data)
      })
    })
  })
})
