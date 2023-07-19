import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { randomHash } from './utils'
import { INftRolesInterfaceId, INftRolesMetadataInterfaceId } from './contants'

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

    describe('ERC165', async function(){
      it("should return true for INftRoles interface id (0x688fce16)", async function (){
        expect(await nftRolesMetadata.supportsInterface(INftRolesInterfaceId)).to.be.true
      })
      it("should return true for INftRolesMetadata interface id (0x953b1304)", async function (){
        expect(await nftRolesMetadata.supportsInterface(INftRolesMetadataInterfaceId)).to.be.true
      })
    })
  })
})
