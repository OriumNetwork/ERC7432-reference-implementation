// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.9;

import { INftRoles } from "../../NftRoles/interfaces/INftRoles.sol";

/// @notice The Nfts Roles Metadata interface enables querying metadata about the Nft Roles contract.
interface INftRolesMetadata is INftRoles {
    struct Metadata {
        string name;
        string description;
        bool supportsMultipleAssignments;
        bytes data;
    }

    /// @notice Emitted when the metadata of a role is set.
    /// @param role The role identifier.
    /// @param name The name of the role.
    /// @param description The description of the role.
    /// @param supportsMultipleAssignments if false, means that the role only considers the last assignment as the active one.
    /// @param data The metadata of the role.
    event RoleMetadata(bytes32 indexed role, string name, string description, bool supportsMultipleAssignments, bytes data);

    /// @notice Sets the metadata of a role.
    /// @param _role The role identifier.
    /// @param _name The name of the role.
    /// @param _description The description of the role.
    /// @param _supportsMultipleAssignments if false, means that the role only considers the last assignment as the active one.
    /// @param _data The data of the role.
    function setRole(bytes32 _role, string calldata _name, string calldata _description, bool _supportsMultipleAssignments, bytes calldata _data) external;

    /// @notice Returns the name of the role.
    /// @param _role The role to query.
    function roleName(bytes32 _role) external view returns (string memory);

    /// @notice Returns the description of the role.
    /// @param _role The role to query.
    function roleDescription(bytes32 _role) external view returns (string memory);

    /// @notice Returns the metadata of the role.
    /// @param _role The role to query.
    function roleMetadata(bytes32 _role) external view returns (bytes memory);

    /// @notice Returns whether the role supports multiple assignments.
    /// @param _role The role to query.
    function roleSupportsMultipleAssignments(bytes32 _role) external view returns (bool);
}
