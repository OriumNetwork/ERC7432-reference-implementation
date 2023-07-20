import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { randomHash } from './utils'
import { NftRolesInterfaceId, NftRolesMetadataInterfaceId } from './contants'

describe('Nfts Roles Metadata', () => {
  let nftRolesMetadata: Contract

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let deployer: SignerWithAddress

  const role = randomHash()
  const name = 'role name'
  const description = 'role description'
  const supportMultipleAssignments = true
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
        await expect(nftRolesMetadata.setRole(role, name, description, supportMultipleAssignments, data))
          .to.emit(nftRolesMetadata, 'RoleMetadata')
          .withArgs(role, name, description, supportMultipleAssignments, data)
      })
    })

    describe('Get role metadata', async () => {
      beforeEach(async () => {
        await nftRolesMetadata.setRole(role, name, description, supportMultipleAssignments, data)
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
      it("should get role supportsMultipleAssignments", async () => {
        expect(await nftRolesMetadata.roleSupportsMultipleAssignments(role)).to.be.true
      })
    })

    describe('ERC165', async function(){
      it(`should return true for INftRoles interface id (${NftRolesInterfaceId})`, async function (){
        expect(await nftRolesMetadata.supportsInterface(NftRolesInterfaceId)).to.be.true
      })
      it(`should return true for INftRolesMetadata interface id (${NftRolesMetadataInterfaceId})`, async function (){
        expect(await nftRolesMetadata.supportsInterface(NftRolesMetadataInterfaceId)).to.be.true
      })
    })
  })
})
