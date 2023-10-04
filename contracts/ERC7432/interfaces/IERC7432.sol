// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.9;

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title ERC-7432 Non-Fungible Token Roles
/// @dev See https://eips.ethereum.org/EIPS/eip-7432
/// Note: the ERC-165 identifier for this interface is 0x25be10b2.
interface IERC7432 is IERC165 {
    struct RoleData {
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct RoleAssignment {
        bytes32 role;
        address tokenAddress;
        uint256 tokenId;
        address grantor;
        address grantee;
        uint64 expirationDate;
    }

    /** Events **/

    /// @notice Emitted when a role is granted.
    /// @param _roleAssignment The role assignment data.
    /// @param _revocable Whether the role is revocable or not.
    /// @param _data The custom data of the role assignment.
    event RoleGranted(RoleAssignment _roleAssignment, bool _revocable, bytes _data);

    /// @notice Emitted when a role is revoked.
    /// @param _roleAssignment The role assignment data.
    event RoleRevoked(RoleAssignment _roleAssignment);

    /// @notice Emitted when a user is approved to manage any role on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _isApproved The approval status.
    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool _isApproved);

    /** External Functions **/

    /// @notice Grants a role by the grantor or an approved operator.
    /// @param _roleAssignment The role assignment data.
    /// @param _data The custom data of the role assignment.
    function grantRoleFrom(RoleAssignment calldata _roleAssignment, bytes calldata _data) external;

    /// @notice Grants a revocable role by the grantor or an approved operator.
    /// @param _roleAssignment The role assignment data.
    /// @param _data The custom data of the role assignment.
    function grantRevocableRoleFrom(RoleAssignment calldata _roleAssignment, bytes calldata _data) external;

    /// @notice Revokes a role on behalf of a user.
    /// @param _roleAssignment The role assignment data.
    function revokeRoleFrom(RoleAssignment calldata _roleAssignment) external;

    /// @notice Approves operator to grant and revoke any roles on behalf of another user.
    /// @param _tokenAddress The token address.
    /// @param _operator The user approved to grant and revoke roles.
    /// @param _approved The approval status.
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    /** View Functions **/

    /// @notice Checks if a user has a role.
    /// @param _roleAssignment The role assignment data.
    function hasRole(RoleAssignment calldata _roleAssignment) external view returns (bool);

    /// @notice Checks if a user has a unique role.
    /// @param _roleAssignment The role assignment data.
    function hasUniqueRole(RoleAssignment calldata _roleAssignment) external view returns (bool);

    /// @notice Returns the custom data of a role assignment.
    /// @param _roleAssignment The role assignment data.
    function roleData(RoleAssignment calldata _roleAssignment) external view returns (bytes memory data_);

    /// @notice Returns the expiration date of a role assignment.
    /// @param _roleAssignment The role assignment data.
    function roleExpirationDate(RoleAssignment calldata _roleAssignment) external view returns (uint64 expirationDate_);

    /// @notice Checks if the grantor approved the operator for all NFTs.
    /// @param _tokenAddress The token address.
    /// @param _grantor The user that approved the operator.
    /// @param _operator The user that can grant and revoke roles.
    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) external view returns (bool);


    /// @notice Returns the last grantee of a role.
    /// @param _grantor The user that granted the role.
    /// @param _tokenAddress The token address.
    /// @param _tokenId The token ID.
    /// @param _role The role.
    function lastGrantee(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _role
    ) external view returns (address);
}
