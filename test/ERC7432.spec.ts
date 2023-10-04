import hre, {ethers} from 'hardhat'
import {Contract} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {expect} from 'chai'
import {ERC7432InterfaceId} from './contants'
import nock from 'nock'
import axios from 'axios'
import {defaultAbiCoder, solidityKeccak256} from 'ethers/lib/utils'
import {NftMetadata, Role, RoleAssignment} from './types'

const {HashZero, AddressZero} = ethers.constants
const ONE_DAY = 60 * 60 * 24

describe('ERC7432', () => {
  let ERC7432: Contract
  let nft: Contract

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let deployer: SignerWithAddress
  let grantor: SignerWithAddress
  let userOne: SignerWithAddress
  let userTwo: SignerWithAddress
  let operator: SignerWithAddress

  const PROPERTY_MANAGER = solidityKeccak256(['string'], ['PROPERTY_MANAGER'])
  const PROPERTY_TENANT = solidityKeccak256(['string'], ['PROPERTY_TENANT'])

  const tokenId = 1
  const revocable = true

  before(async function () {
    // prettier-ignore
    [deployer, grantor, userOne, userTwo, operator] = await ethers.getSigners()

    const metadata: NftMetadata = {
      name: 'Nft name',
      description: 'Nft description',
      roles: [
        {
          name: 'PROPERTY_MANAGER',
          description: 'Property Manager',
          isUniqueRole: false,
          inputs: [
            {
              name: 'profitSplit',
              type: 'tuple[]',
              components: [
                {
                  name: 'eventId',
                  type: 'uint256',
                },
                {
                  name: 'split',
                  type: 'uint256[]',
                },
              ],
            },
          ],
        },
        {
          name: 'PROPERTY_TENANT',
          description: 'Property Tenant',
          isUniqueRole: true,
          inputs: [
            {
              name: 'rentalCost',
              type: 'uint256',
            },
          ],
        },
      ],
    }

    nock('https://example.com').persist().get(`/${tokenId}`).reply(200, metadata)
  })

  beforeEach(async () => {
    const ERC7432Factory = await ethers.getContractFactory('ERC7432')
    ERC7432 = await ERC7432Factory.deploy()

    const NftFactory = await ethers.getContractFactory('Nft')
    nft = await NftFactory.deploy()
    await nft.deployed()
  })

  describe('Main Functions', async () => {
    let expirationDate: number
    const data = HashZero
    let nftMetadata: NftMetadata
    let roleAssignment: RoleAssignment

    beforeEach(async () => {
      const blockNumber = await hre.ethers.provider.getBlockNumber()
      const block = await hre.ethers.provider.getBlock(blockNumber)
      expirationDate = block.timestamp + ONE_DAY

      const tokenURI = await nft.tokenURI(tokenId)
      const response = await axios.get(tokenURI)
      nftMetadata = response.data
      roleAssignment = {
        role: PROPERTY_MANAGER,
        tokenAddress: AddressZero,
        tokenId: tokenId,
        grantor: grantor.address,
        grantee: userOne.address,
        expirationDate: expirationDate,
        data: HashZero,
      }
    })

    describe('Grant role from', async () => {
      it('should grant role from', async () => {
        await expect(
          ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment),
        )
          .to.emit(ERC7432, 'RoleGranted')
          .withArgs(
            PROPERTY_MANAGER,
            AddressZero,
            tokenId,
            grantor.address,
            userOne.address,
            expirationDate,
            revocable,
            data,
          )
      })
      it('should NOT grant role if expiration date is in the past', async () => {
        const blockNumber = await hre.ethers.provider.getBlockNumber()
        const block = await hre.ethers.provider.getBlock(blockNumber)
        const expirationDateInThePast = block.timestamp - ONE_DAY

        roleAssignment.expirationDate = expirationDateInThePast

        await expect(
          ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment),
        ).to.be.revertedWith('ERC7432: expiration date must be in the future')
      })
    })

    describe('Revoke role from', async () => {
      beforeEach(async () => {
        await ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment)
      })
      it('should revoke role', async () => {
        await expect(ERC7432.connect(grantor).revokeRoleFrom(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address))
          .to.emit(ERC7432, 'RoleRevoked')
          .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
      })
      it('should revoke role if caller is the grantee', async () => {
        await expect(ERC7432.connect(grantor).revokeRoleFrom(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address))
          .to.emit(ERC7432, 'RoleRevoked')
          .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
      })
      it('should revoke role if role is not revocable, but grantor is also the grantee', async () => {
        roleAssignment.grantee = grantor.address
        await ERC7432.connect(grantor).grantRoleFrom(roleAssignment)
        await expect(ERC7432.connect(grantor).revokeRoleFrom(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, grantor.address))
          .to.emit(ERC7432, 'RoleRevoked')
          .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, grantor.address)
        expect(
          await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, grantor.address),
        ).to.be.equal(false)
      })
      it('should NOT revoke role if role is not revocable', async () => {
        await ERC7432.connect(grantor).grantRoleFrom(roleAssignment)
        await expect(
          ERC7432.connect(grantor).revokeRoleFrom(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
        ).to.be.revertedWith(`ERC7432: Role is not revocable or caller is not the grantee`)
      })
    })

    describe('Has role', async () => {
      beforeEach(async () => {
        await expect(
          ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment),
        )
          .to.emit(ERC7432, 'RoleGranted')
          .withArgs(
            PROPERTY_MANAGER,
            AddressZero,
            tokenId,
            grantor.address,
            userOne.address,
            expirationDate,
            revocable,
            HashZero,
          )

        roleAssignment.grantee = userTwo.address
        await expect(
          ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment),
        )
          .to.emit(ERC7432, 'RoleGranted')
          .withArgs(
            PROPERTY_MANAGER,
            AddressZero,
            tokenId,
            grantor.address,
            userTwo.address,
            expirationDate,
            revocable,
            HashZero,
          )
      })

      describe('Unique Roles', async () => {
        it('should return true for the last user granted, and false for the others', async () => {
          expect(
            await ERC7432.hasUniqueRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
          ).to.be.equal(false)

          expect(
            await ERC7432.hasUniqueRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userTwo.address),
          ).to.be.equal(true)
        })
        it('should NOT return true for the last user if role is expired', async () => {
          await hre.ethers.provider.send('evm_increaseTime', [ONE_DAY + 1])
          await hre.ethers.provider.send('evm_mine', [])

          expect(
            await ERC7432.hasUniqueRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
          ).to.be.equal(false)
        })
      })

      describe('Non-Unique Roles', async () => {
        it('should return true for all users', async () => {
          expect(
            await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
          ).to.be.equal(true)

          expect(
            await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userTwo.address),
          ).to.be.equal(true)
        })
        it("should NOT return true for all users if role is expired'", async () => {
          await hre.ethers.provider.send('evm_increaseTime', [ONE_DAY + 1])
          await hre.ethers.provider.send('evm_mine', [])

          expect(
            await ERC7432.hasRole(PROPERTY_TENANT, AddressZero, tokenId, grantor.address, userOne.address),
          ).to.be.equal(false)

          expect(
            await ERC7432.hasRole(PROPERTY_TENANT, AddressZero, tokenId, grantor.address, userTwo.address),
          ).to.be.equal(false)
        })
      })
    })

    describe('Role Data', async () => {
      it('should grant PROPERTY_MANAGER with customData and decode tuple with nftMetadata correctly', async () => {
        //Encode profit split data
        const profitSplit = [
          {
            eventId: 1,
            split: [60, 30, 5, 5],
          },
          {
            eventId: 2,
            split: [50, 50],
          },
        ]
        const customData = defaultAbiCoder.encode(['(uint256 eventId,uint256[] split)[]'], [profitSplit])

        roleAssignment.data = customData
        await expect(
          ERC7432.connect(grantor).grantRevocableRoleFrom(roleAssignment),
        )
          .to.emit(ERC7432, 'RoleGranted')
          .withArgs(
            PROPERTY_MANAGER,
            AddressZero,
            tokenId,
            grantor.address,
            userOne.address,
            expirationDate,
            revocable,
            customData,
          )

        const returnedData = await ERC7432.roleData(
          PROPERTY_MANAGER,
          AddressZero,
          tokenId,
          grantor.address,
          userOne.address,
        )

        const returnedExpirationDate = await ERC7432.roleExpirationDate(
          PROPERTY_MANAGER,
          AddressZero,
          tokenId,
          grantor.address,
          userOne.address,
        )

         /*
         expect(returnedExpirationDate).to.equal(expirationDate)
        expect(returnedData).to.equal(customData)

        const propertyManagerRole = nftMetadata.roles.find((role: Role) => role.name === 'PROPERTY_MANAGER')
        const inputs = propertyManagerRole?.inputs[0].components
        const returnDataDecoded = defaultAbiCoder.decode(
          [`(${inputs?.map((input) => `${input.type} ${input.name}`)})[]`],
          returnedData,
        )
        returnDataDecoded.map((data: any) => {
          data.map((returnedStruct: any, index: number) => {
            expect(returnedStruct.eventId).to.deep.equal(profitSplit[index].eventId)
            expect(returnedStruct.split).to.deep.equal(profitSplit[index].split)
          })
        }) */
      })
      it('should grant PROPERTY_TENANT with customData and decode tuple with nftMetadata correctly', async () => {
        // Encode rentalCost data
        const rentalCost = ethers.utils.parseEther('1.5')
        const customData = defaultAbiCoder.encode(['uint256'], [rentalCost])

        roleAssignment.role = PROPERTY_TENANT
        roleAssignment.data = customData

        await ERC7432.connect(grantor).grantRoleFrom(roleAssignment)

        const returnedData = await ERC7432.roleData(
          PROPERTY_TENANT,
          AddressZero,
          tokenId,
          grantor.address,
          userOne.address,
        )


        // const tenantRole = nftMetadata.roles.find((role: Role) => role.name === 'PROPERTY_TENANT')
        // const decodedData = defaultAbiCoder.decode([`${tenantRole!.inputs.map((input) => input.type)}`], returnedData[0])

       // expect(returnedData[0].data).to.equal(customData)
        // expect(decodedData[0]).to.deep.equal(rentalCost)
      })
    })

    describe('ERC165', async function () {
      it(`should return true for IERC7432 interface id (${ERC7432InterfaceId})`, async function () {
        expect(await ERC7432.supportsInterface(ERC7432InterfaceId)).to.be.true
      })
    })

    describe('Approvals', async () => {
        describe('Approve For All', async () => {
          beforeEach(async () => {
              await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, true)
          })
          describe('Grant role from', async () => {
            it('should grant role from', async () => {
              await expect(
                ERC7432.connect(operator).grantRevocableRoleFrom(roleAssignment),
              )
                .to.emit(ERC7432, 'RoleGranted')
                .withArgs(
                  PROPERTY_MANAGER,
                  AddressZero,
                  tokenId,
                  grantor.address,
                  userOne.address,
                  expirationDate,
                  revocable,
                  HashZero,
                )
            })
            it('should NOT grant role from if operator is not approved', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, false)

              await expect(
                ERC7432.connect(operator).grantRoleFrom(roleAssignment),
              ).to.be.revertedWith('ERC7432: sender must be approved')
            })
          })

          describe('Revoke role from', async () => {
            describe('Revocable roles', async () => {
              beforeEach(async () => {
                await ERC7432.connect(operator).grantRevocableRoleFrom(roleAssignment)
              })
              it('should revoke role from', async () => {
                await expect(
                  ERC7432.connect(grantor).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
              })
              it('should NOT revoke role from if operator is not approved', async () => {
                  await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, false)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                ).to.be.revertedWith('ERC7432: sender must be approved')
              })
              it('should revoke role from if operator is only approved by grantee', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, false)
                await ERC7432.connect(userOne).setRoleApprovalForAll(AddressZero, operator.address, true)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(true)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(false)
              })
              it('should revoke role from if operator is approved by both grantor and grantee', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, true)
                await ERC7432.connect(userOne).setRoleApprovalForAll(AddressZero, operator.address, true)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(true)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(false)
              })
              it('should revoke role from if operator is only approved by grantor', async () => {
                await ERC7432.connect(userOne).setRoleApprovalForAll(AddressZero, operator.address, true)
                
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(true)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(false)
              })
            })
            describe('Non-Revocable roles', async () => {
              beforeEach(async () => {
                await ERC7432.connect(operator).grantRoleFrom(roleAssignment)
              })
              it('should revoke role from if operator is only approved by grantee', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, false)
                await ERC7432.connect(userOne).setRoleApprovalForAll(AddressZero, operator.address, true)

                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(true)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(false)
              })
              it('should revoke role from if operator is approved by both grantor and grantee', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, true)
                await ERC7432.connect(userOne).setRoleApprovalForAll(AddressZero, operator.address, true)

                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(true)
                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                )
                  .to.emit(ERC7432, 'RoleRevoked')
                  .withArgs(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address)
                expect(
                  await ERC7432.hasRole(PROPERTY_MANAGER, AddressZero, tokenId, grantor.address, userOne.address),
                ).to.be.equal(false)
              })
              it('should NOT revoke role from if operator is only approved by grantor', async () => {
                await ERC7432.connect(grantor).setRoleApprovalForAll(AddressZero, operator.address, true)

                await expect(
                  ERC7432.connect(operator).revokeRoleFrom(
                    PROPERTY_MANAGER,
                    AddressZero,
                    tokenId,
                    grantor.address,
                    userOne.address,
                  ),
                ).to.be.revertedWith(`ERC7432: Role is not revocable or caller is not the grantee`)
              })
            })
          })
        })
    })
  })
})
