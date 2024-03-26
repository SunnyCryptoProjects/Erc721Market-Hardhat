// SPDX-License-Identifier: GPL-3.0

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

pragma solidity >=0.8.20 <0.9.0;

library SigLib {
    function isValidSignature(
        bytes32 domainSeparator,
        bytes32 structHash,
        address signer,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 hash = MessageHashUtils.toTypedDataHash({
            domainSeparator: domainSeparator,
            structHash: structHash
        });
        address recovered = ECDSA.recover({
            hash: hash, 
            signature: signature
        });
        return recovered == signer;
    }
}
