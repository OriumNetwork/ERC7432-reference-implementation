// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.9;

import { INftRoles } from "../../NftRoles/interfaces/INftRoles.sol";

/// @notice The Nfts Roles Metadata interface enables querying metadata about the Nft Roles contract.
interface INftRolesMetadata is INftRoles {
    struct RoleMetadata {
        string name;
        string description;
        bytes metadata;
    }

    event RoleMetadataSet(bytes32 indexed role, string name, string description, bytes metadata);

    /// @notice Sets the metadata of a role.
    /// @param _role The role identifier.
    /// @param _name The name of the role.
    /// @param _description The description of the role.
    /// @param _metadata The metadata of the role.
    function setRoleMetadata(
        bytes32 _role,
        string calldata _name,
        string calldata _description,
        bytes calldata _metadata
    ) external;

    /// @notice Returns the name of the role.
    /// @param _role The role to query.
    function roleName(bytes32 _role) external view returns (string memory);

    /// @notice Returns the description of the role.
    /// @param _role The role to query.
    function roleDescription(bytes32 _role) external view returns (string memory);

    /// @notice Returns the metadata of the role.
    /// @param _role The role to query.
    function roleMetadata(bytes32 _role) external view returns (bytes memory);
}
