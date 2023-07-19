// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.9;

import { INftRoles } from "./INftRoles.sol";

/// @notice The Nfts Roles Metadata interface enables querying metadata about the Nft Roles contract.
interface INftRolesMetadata is INftRoles {
    function roleName(bytes32 _role) external view returns (string memory);

    function roleDescription(bytes32 _role) external view returns (string memory);

    function roleMetadata(bytes32 _role) external view returns (bytes memory);
}
