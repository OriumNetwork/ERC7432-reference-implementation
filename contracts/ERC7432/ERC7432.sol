// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.9;

import { IERC7432 } from "./interfaces/IERC7432.sol";

contract ERC7432 is IERC7432 {
    // grantor => grantee => tokenAddress => tokenId => role => struct(expirationDate, data)
    mapping(address => mapping(address => mapping(address => mapping(uint256 => mapping(bytes32 => RoleData)))))
        public roleAssignments;

    // grantor => tokenAddress => tokenId => role => grantee
    mapping(address => mapping(address => mapping(uint256 => mapping(bytes32 => address)))) public latestGrantees;

    // grantor => tokenAddress => tokenId => operator => isApproved
    mapping(address => mapping(address => mapping(uint256 => mapping(address => bool)))) public tokenIdApprovals;

    // grantor => operator => tokenAddress => isApproved
    mapping(address => mapping(address => mapping(address => bool))) public tokenApprovals;

    modifier validExpirationDate(uint64 _expirationDate) {
        require(_expirationDate > block.timestamp, "ERC7432: expiration date must be in the future");
        _;
    }

    modifier onlyApproved(
        address _tokenAddress,
        uint256 _tokenId,
        address _account
    ) {
        require(isRoleApprovedForAll(_tokenAddress, _account, msg.sender), "ERC7432: sender must be approved");
        _;
    }

    function grantRoleFrom(
        RoleAssignment calldata _roleAssignment,
        bytes calldata _data
    ) external override onlyApproved(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor) {
        _grantRole(_roleAssignment, false, _data);
    }

    function grantRevocableRoleFrom(
        RoleAssignment calldata _roleAssignment,
        bytes calldata _data
    ) external override onlyApproved(_roleAssignment.tokenAddress, _roleAssignment.tokenId, _roleAssignment.grantor) {
        _grantRole(_roleAssignment, true, _data);
    }

    function _grantRole(
        RoleAssignment memory _roleAssignment,
        bool _revocable,
        bytes calldata _data
    ) internal validExpirationDate(_roleAssignment.expirationDate) {
        roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][_roleAssignment.tokenAddress][
            _roleAssignment.tokenId
        ][_roleAssignment.role] = RoleData(_roleAssignment.expirationDate, _revocable, _data);
        latestGrantees[_roleAssignment.grantor][_roleAssignment.tokenAddress][_roleAssignment.tokenId][
            _roleAssignment.role
        ] = _roleAssignment.grantee;
        emit RoleGranted(_roleAssignment, _revocable, _data);
    }

    function revokeRoleFrom(RoleAssignment calldata _roleAssignment) external override {
        address _caller = _getApprovedCaller(
            _roleAssignment.tokenAddress,
            _roleAssignment.grantor,
            _roleAssignment.grantee
        );
        _revokeRole(_roleAssignment, _caller);
    }

    function _getApprovedCaller(
        address _tokenAddress,
        address _revoker,
        address _grantee
    ) internal view returns (address) {
        if (isRoleApprovedForAll(_tokenAddress, _grantee, msg.sender)) {
            return _grantee;
        } else if (isRoleApprovedForAll(_tokenAddress, _revoker, msg.sender)) {
            return _revoker;
        } else {
            revert("ERC7432: sender must be approved");
        }
    }

    function _revokeRole(RoleAssignment calldata _roleAssignment, address _caller) internal {
        bool _isRevocable = roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][
            _roleAssignment.tokenAddress
        ][_roleAssignment.tokenId][_roleAssignment.role].revocable;
        require(
            _isRevocable || _caller == _roleAssignment.grantee,
            "ERC7432: Role is not revocable or caller is not the grantee"
        );
        delete roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][_roleAssignment.tokenAddress][
            _roleAssignment.tokenId
        ][_roleAssignment.role];
        delete latestGrantees[_roleAssignment.grantor][_roleAssignment.tokenAddress][_roleAssignment.tokenId][
            _roleAssignment.role
        ];
        emit RoleRevoked(_roleAssignment);
    }

    function hasRole(RoleAssignment calldata _roleAssignment) external view returns (bool) {
        return
            roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][_roleAssignment.tokenAddress][
                _roleAssignment.tokenId
            ][_roleAssignment.role].expirationDate > block.timestamp;
    }

    function hasUniqueRole(RoleAssignment calldata _roleAssignment) external view returns (bool) {
        return
            latestGrantees[_roleAssignment.grantor][_roleAssignment.tokenAddress][_roleAssignment.tokenId][
                _roleAssignment.role
            ] ==
            _roleAssignment.grantee &&
            roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][_roleAssignment.tokenAddress][
                _roleAssignment.tokenId
            ][_roleAssignment.role].expirationDate >
            block.timestamp;
    }

    function roleData(RoleAssignment calldata _roleAssignment) external view returns (bytes memory data_) {
        RoleData memory _roleData = roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][
            _roleAssignment.tokenAddress
        ][_roleAssignment.tokenId][_roleAssignment.role];
        return (_roleData.data);
    }

    function roleExpirationDate(
        RoleAssignment calldata _roleAssignment
    ) external view returns (uint64 expirationDate_) {
        RoleData memory _roleData = roleAssignments[_roleAssignment.grantor][_roleAssignment.grantee][
            _roleAssignment.tokenAddress
        ][_roleAssignment.tokenId][_roleAssignment.role];
        return (_roleData.expirationDate);
    }

    function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId;
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _isApproved) external override {
        tokenApprovals[msg.sender][_tokenAddress][_operator] = _isApproved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _isApproved);
    }

    function isRoleApprovedForAll(
        address _tokenAddress,
        address _grantor,
        address _operator
    ) public view override returns (bool) {
        return tokenApprovals[_grantor][_tokenAddress][_operator];
    }

    function lastGrantee(
        address _grantor,
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _role
    ) public view override returns (address) {
        return latestGrantees[_grantor][_tokenAddress][_tokenId][_role];
    }
}
