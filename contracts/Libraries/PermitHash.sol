// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISignatureTransfer} from '../Interfaces/ISignatureTransfer.sol';

library PermitHash {
    bytes32 public constant _TOKEN_PERMISSIONS_TYPEHASH =
        keccak256('TokenPermissions(address token,uint256 tokenId)');

    bytes32 public constant _PERMIT_TRANSFER_FROM_TYPEHASH =
        keccak256(
            'PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 tokenId)'
        );

    bytes32 public constant _PERMIT_BATCH_TRANSFER_FROM_TYPEHASH =
        keccak256(
            'PermitBatchTransferFrom(TokenPermissions[] permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 tokenId)'
        );

    string public constant _TOKEN_PERMISSIONS_TYPESTRING =
        'TokenPermissions(address token,uint256 tokenId)';

    string public constant _PERMIT_TRANSFER_FROM_WITNESS_TYPEHASH_STUB =
        'PermitWitnessTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline,';

    string public constant _PERMIT_BATCH_WITNESS_TRANSFER_FROM_TYPEHASH_STUB =
        'PermitBatchWitnessTransferFrom(TokenPermissions[] permitted,address spender,uint256 nonce,uint256 deadline,';

    function hash(
        ISignatureTransfer.PermitTransferFrom memory permit
    ) internal view returns (bytes32) {
        bytes32 tokenPermissionsHash = _hashTokenPermissions(permit.permitted);
        return
            keccak256(
                abi.encode(
                    _PERMIT_TRANSFER_FROM_TYPEHASH,
                    tokenPermissionsHash,
                    msg.sender,
                    permit.nonce,
                    permit.deadline
                )
            );
    }

    function hash(
        ISignatureTransfer.PermitBatchTransferFrom memory permit
    ) internal view returns (bytes32) {
        uint256 numPermitted = permit.permitted.length;
        bytes32[] memory tokenPermissionHashes = new bytes32[](numPermitted);

        for (uint256 i = 0; i < numPermitted; ++i) {
            tokenPermissionHashes[i] = _hashTokenPermissions(
                permit.permitted[i]
            );
        }

        return
            keccak256(
                abi.encode(
                    _PERMIT_BATCH_TRANSFER_FROM_TYPEHASH,
                    keccak256(abi.encodePacked(tokenPermissionHashes)),
                    msg.sender,
                    permit.nonce,
                    permit.deadline
                )
            );
    }

    function hashWithWitness(
        ISignatureTransfer.PermitTransferFrom memory permit,
        bytes32 witness,
        string calldata witnessTypeString
    ) internal view returns (bytes32) {
        bytes32 typeHash = keccak256(
            abi.encodePacked(
                _PERMIT_TRANSFER_FROM_WITNESS_TYPEHASH_STUB,
                witnessTypeString
            )
        );

        bytes32 tokenPermissionsHash = _hashTokenPermissions(permit.permitted);
        return
            keccak256(
                abi.encode(
                    typeHash,
                    tokenPermissionsHash,
                    msg.sender,
                    permit.nonce,
                    permit.deadline,
                    witness
                )
            );
    }

    function hashWithWitness(
        ISignatureTransfer.PermitBatchTransferFrom memory permit,
        bytes32 witness,
        string calldata witnessTypeString
    ) internal view returns (bytes32) {
        bytes32 typeHash = keccak256(
            abi.encodePacked(
                _PERMIT_BATCH_WITNESS_TRANSFER_FROM_TYPEHASH_STUB,
                witnessTypeString
            )
        );

        uint256 numPermitted = permit.permitted.length;
        bytes32[] memory tokenPermissionHashes = new bytes32[](numPermitted);

        for (uint256 i = 0; i < numPermitted; ++i) {
            tokenPermissionHashes[i] = _hashTokenPermissions(
                permit.permitted[i]
            );
        }

        return
            keccak256(
                abi.encode(
                    typeHash,
                    keccak256(abi.encodePacked(tokenPermissionHashes)),
                    msg.sender,
                    permit.nonce,
                    permit.deadline,
                    witness
                )
            );
    }

    function _hashTokenPermissions(
        ISignatureTransfer.TokenPermissions memory permitted
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(_TOKEN_PERMISSIONS_TYPEHASH, permitted));
    }
}
