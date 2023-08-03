# Nft Roles

[![Coverage Status](https://coveralls.io/repos/github/OriumNetwork/nft-roles/badge.svg?branch=master)](https://coveralls.io/github/OriumNetwork/nft-roles?branch=master)
![Github Badge](https://github.com/OriumNetwork/nft-roles/actions/workflows/all.yml/badge.svg)
[![solidity - v0.8.9](https://img.shields.io/static/v1?label=solidity&message=v0.8.9&color=2ea44f&logo=solidity)](https://github.com/OriumNetwork)
[![License: CC0 v1](https://img.shields.io/badge/License-CC0v1-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/legalcode)
[![Discord](https://img.shields.io/discord/1009147970832322632?label=discord&logo=discord&logoColor=white)](https://discord.gg/NaNTgPK5rx)
[![Twitter Follow](https://img.shields.io/twitter/follow/oriumnetwork?label=Follow&style=social)](https://twitter.com/OriumNetwork)

Contains a minimal implementation of the NFT Roles standard.

# Build

```bash
npm install
npm run build
```

# Test

```bash
npm run test
```
## Abstract

This standard introduces role management for NFTs. Each role assignment is associated with a single NFT and expires
automatically at a given timestamp. Inspired by [ERC-5982](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-5982.md), roles are defined as `bytes32` and feature a
custom `_data` field of arbitrary size to allow customization.

## Motivation

The NFT Roles interface aims to establish a standard for role management in NFTs. Tracking on-chain roles enables
decentralized applications (dApps) to implement access control for privileged actions, e.g., minting tokens with a role
(airdrop claim rights).

NFT roles can be deeply integrated with dApps to create a utility-sharing mechanism. A good example is in digital real
estate. A user can create a digital property NFT and grant a `keccak256("PROPERTY_MANAGER")` role to another user,
allowing them to delegate specific utility without compromising ownership. The same user could also grant multiple
`keccak256("PROPERTY_TENANT")` roles, allowing the grantees to access and interact with the digital property.

There are also interesting use cases in decentralized finance (DeFi). Insurance policies could be issued as NFTs, and 
the beneficiaries, insured, and insurer could all be on-chain roles tracked using this standard.

## Rationale

ERC-7432 IS NOT an extension of [ERC-721](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md) or [ERC-1155](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md). The main reason behind this
decision is to keep the standard agnostic of any NFT implementation. This approach also enables the standard to be
implemented externally or on the same contract as the NFT, and allow dApps to use roles with immutable NFTs.

### Automatic Expiration

Automatic expiration is implemented via the `grantRole` and `hasRole` functions. `grantRole` is responsible for setting
the expiration date, and `hasRole` checks if the role is expired by comparing with the current block timestamp
(`block.timestamp`). Since `uint256` is not natively supported by most programming languages, dates are represented as
`uint64` on this standard. The maximum UNIX timestamp represented by a `uint64` is about the year `584,942,417,355`,
which should be enough to be considered "permanent". For this reason, it's RECOMMENDED using `type(uint64).max` when
calling the `grantRole` function to support use cases that require an assignment never to expire.

### Unique and Non-Unique Roles

The standard supports both unique and non-unique roles. Unique roles are roles that can be assigned to only one account,
while non-unique roles can be granted to multiple accounts simultaneously. The parameter `_supportsMultipleAssignments`
was included in the `hasRole` function to support both cases. When `_supportsMultipleAssignments` is `true`, the
function checks if the assignment exists and is not expired. However, when `false`, the function also validates that no
other role was granted afterward. In other words, each new role assignment invalidates the previous one for unique
roles, meaning only the last assignment granted can be valid.

### Custom Data

DApps can customize roles using the `_data` parameter of the `grantRole` function. `_data`  is implemented using the
generic type `bytes` to enable dApps to encode any role-specific information when creating a role assignment. The custom
data is retrievable using the `roleData` function and is emitted with the `RoleGranted` event. With this approach, the
standard allows dApps to integrate this information into their applications, both on-chain and off-chain.

### Metadata Extension

The Roles Metadata extension extends the traditional JSON-based metadata schema of NFTs. Therefore, DApps supporting
this feature MUST also implement the metadata extension of [ERC-721](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md) or [ERC-1155](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md). This
extension is **optional** and allows developers to provide additional information for roles.

Updated Metadata Schema:

```js
{

  /** Existing NFT Metadata **/

  "title": "Asset Metadata",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Identifies the asset to which this NFT represents"
    },
    "description": {
      "type": "string",
      "description": "Describes the asset to which this NFT represents"
    },
    "image": {
      "type": "string",
      "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
    }
  },

  /** Additional fields for Roles **/

  "roles": [
    {
      "id": {
        "type": "bytes32",
        "description": "Identifies the role"
      },
      "name": {
        "type": "string",
        "description": "Human-readable name of the role"
      },
      "description": {
        "type": "string",
        "description": "Describes the role"
      },
      "supportsMultipleAssignments": {
        "type": "boolean",
        "description": "Whether the role supports simultaneous assignments or not"
      },
      "inputs": [
        {
          "name": {
            "type": "string",
            "description": "Human-readable name of the argument"
          },
          "type": {
            "type": "string",
            "description": "Solidity type, e.g., uint256 or address"
          }
        }
      ]
    }
  ]

}
```

The following JSON is an example of ERC-7432 Metadata:

```js
{
  // ... Existing NFT Metadata

  "roles": [
    {
      // keccak256("PROPERTY_MANAGER")
      "id": "0x5cefc88e2d50f91b66109b6bb76803f11168ca3d1cee10cbafe864e4749970c7",
      "name": "Property Manager",
      "description": "The manager of the property is responsible for furnishing it and ensuring its good condition.",
      "supportsMultipleAssignments": false,
      "inputs": []
    },
    {
      // keccak256("PROPERTY_TENANT")
      "id": "0x06a3b33b0a800805559ee9c64f55afd8a43a05f8472feb6f6b77484ff5ac9c26",
      "name": "Property Tenant",
      "description": "The tenant of the property is responsible for paying the rent and keeping the property in good condition.",
      "supportsMultipleAssignments": true,
      "inputs": [
        {
          "name": "rent",
          "type": "uint256"
        }
      ]
    }
  ]

}
```

The properties of the `roles` array are SUGGESTED, and developers should add any other relevant information as necessary
(e.g., an image for the role). However, it's highly RECOMMENDED to include the `supportsMultipleAssignments` field, as
shown in the example. This field is used in the `hasRole` function (refer back to
[Unique and Non-Unique Roles](#unique-and-non-unique-roles)).

## Security Considerations

Developers integrating the Non-Fungible Token Roles interface should consider the following on their implementations:

* Ensure proper access controls are in place to prevent unauthorized role assignments or revocations.
* Take into account potential attack vectors such as reentrancy and ensure appropriate safeguards are in place.
* Since this standard does not check NFT ownership, it's the responsibility of the dApp to query for the NFT Owner and
  pass the correct `_grantor` to the `hasRole` function.
* It's the responsibility of the dApp to check if the role is unique or non-unique. For unique roles, `hasRole` should
be called with `_supportsMultipleAssignments` set to `false` to ensure the role was not assigned to another account.