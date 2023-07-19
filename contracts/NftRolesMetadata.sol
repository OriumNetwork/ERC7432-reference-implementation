// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.9;

import { NftRoles } from "./NftRoles.sol";
import { INftRolesMetadata } from "./interfaces/INftRolesMetadata.sol";

contract NftRolesMetadata is NftRoles, INftRolesMetadata {
    struct RoleMetadata {
        string name;
        string description;
        bytes metadata;
    }

    // role => struct(name, description, metadata)
    mapping(bytes32 => RoleMetadata) public _roleMetadata;

    function setRoleMetadata(
        bytes32 _role,
        string calldata _name,
        string calldata _description,
        bytes calldata _metadata
    ) external {
        _roleMetadata[_role] = RoleMetadata(_name, _description, _metadata);
    }

    function roleName(bytes32 _role) external view override returns (string memory) {
        return _roleMetadata[_role].name;
    }

    function roleDescription(bytes32 _role) external view override returns (string memory) {
        return _roleMetadata[_role].description;
    }

    function roleMetadata(bytes32 _role) external view override returns (bytes memory) {
        return _roleMetadata[_role].metadata;
    }
}
