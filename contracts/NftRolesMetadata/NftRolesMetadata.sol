// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.9;

import { NftRoles } from "../NftRoles/NftRoles.sol";
import { INftRolesMetadata } from "./interfaces/INftRolesMetadata.sol";
import { INftRoles } from "../NftRoles/interfaces/INftRoles.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract NftRolesMetadata is NftRoles, INftRolesMetadata {
    // role => struct(name, description, metadata)
    mapping(bytes32 => Metadata) public _roleMetadata;

    function setRole(
        bytes32 _role,
        string calldata _name,
        string calldata _description,
        bytes calldata _data
    ) external override {
        _roleMetadata[_role] = Metadata(_name, _description, _data);
        emit RoleMetadata(_role, _name, _description, _data);
    }

    function roleName(bytes32 _role) external view override returns (string memory) {
        return _roleMetadata[_role].name;
    }

    function roleDescription(bytes32 _role) external view override returns (string memory) {
        return _roleMetadata[_role].description;
    }

    function roleMetadata(bytes32 _role) external view override returns (bytes memory) {
        return _roleMetadata[_role].data;
    }

    function supportsInterface(bytes4 interfaceId) external view virtual override(NftRoles, IERC165) returns (bool) {
        return interfaceId == type(INftRoles).interfaceId || interfaceId == type(INftRolesMetadata).interfaceId;
    }
}
