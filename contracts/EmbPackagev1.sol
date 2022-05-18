// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract embPackagev1 is
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    ERC2771ContextUpgradeable,
    UUPSUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    CountersUpgradeable.Counter private _tokenIds;

    mapping(uint256 => packageStruct) private packages;

    struct packageStruct {
        string packageName;
        string packageDescription;
        bool isValid;
    }

    modifier isValid(uint256 ids) {
        require(packages[ids].isValid, "Package does not exists");
        _;
    }

    /**
     * This function acts as the constructor
     *
     */
    function initialize(address _forwarder) public virtual initializer {
        __AccessControl_init();
        __ERC2771Context_init(_forwarder);
        __ERC1155_init("");

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function updateForwarder(address _newForwarder) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _trustedForwarder = _newForwarder;
    }

    /**
     * return the sender of this call.
     * if the call came through our trusted forwarder, return the original sender.
     * otherwise, return `msg.sender`.
     * should be used in the contract anywhere instead of msg.sender
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlUpgradeable, ERC1155Upgradeable)
        returns (bool)
    {
        return
            interfaceId == type(IERC1155Upgradeable).interfaceId ||
            interfaceId == type(IERC1155MetadataURIUpgradeable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address sender)
    {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return super._msgSender();
        }
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return super._msgData();
        }
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function setURI(string memory uri_) public virtual onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        _setURI(uri_);
        return true;
    }

    function addPackage(string memory name, string memory desc)
        public
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (bool)
    {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        packages[newTokenId] = packageStruct(name, desc, true);
        return true;
    }

    function mintToken(
        uint256 _id,
        address _to,
        uint256 _amt
    ) public virtual onlyRole(MINTER_ROLE) isValid(_id) returns (bool) {
        _mint(_to, _id, _amt, "");
        return true;
    }
}
