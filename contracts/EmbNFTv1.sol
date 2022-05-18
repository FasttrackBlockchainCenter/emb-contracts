// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract embNFTv1 is
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    ERC2771ContextUpgradeable,
    UUPSUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIds;

    mapping(uint256 => uint256) private _coordinates;

    mapping(uint256 => bool) private _coordsSold;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    modifier isValidMint(uint256 x, uint256 y) {
        uint256 coords = formatCoordinates(x, y);
        require(!_coordsSold[coords], "NFT for data already minted");
        require(_coordinates[coords] == 0, "NFT for {x,y} already minted");
        _;
    }

    modifier isValidApprovals(address _from, address _to) {
        require(!isApprovedForAll(_from, _to), " Approval for all tokens not there ");
        _;
    }

    /**
     * This function acts as the constructor
     *
     */
    function initialize(address _forwarder) public virtual initializer {
        __AccessControl_init();
        __ERC2771Context_init(_forwarder);
        __ERC721_init("Emb Land", "LAND");
        __ERC721URIStorage_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function updateForwarder(address _newForwarder) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _trustedForwarder = _newForwarder;
    }

    /**
     * Mint + Issue NFT
     *
     * @param recipient - NFT will be issued to recipient
     * @param x - x coordinate of property
     * @param y - y coordinate of property
     * @param data - Property URI/Data
     */
     ///
    function mintProperty(
        address recipient,
        uint256 x,
        uint256 y,
        string memory data
    ) public virtual isValidMint(x, y) onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 coords = formatCoordinates(x, y);
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, data);
        _coordsSold[coords] = true;
        _coordinates[coords] = newTokenId;
        return newTokenId;
    }

    /**
     * Get Token ID by Coordinates
     *
     * @param x - x coordinate of property
     * @param y - y coordinate of property
     */
    function getTokenIdByCoordinates(uint256 x, uint256 y) public view virtual returns (uint256) {
        uint256 coords = formatCoordinates(x, y);
        uint256 tokenId = _coordinates[coords];
        require(tokenId != 0, "NFT does not exist");
        return tokenId;
    }

    /**
     * Format Coordinates
     *
     * @param x - x coordinate of property
     * @param y - y coordinate of property
     */
    function formatCoordinates(uint256 x, uint256 y) internal pure virtual returns (uint256) {
        uint256 result = y.add(x.mul(10000000000000000));
        return result;
    }

    /**
     * Batch Transfer Properties
     *
     * @param from - current owner of property
     * @param to - recipient of property
     * @param tokenIds - tokenId of the properties to transfer
     */
    function batchTransferFrom(
        address from,
        address to,
        uint256[] memory tokenIds
    ) public virtual isValidApprovals(from, to) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            safeTransferFrom(from, to, tokenId);
        }
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
        override(AccessControlUpgradeable, ERC721Upgradeable)
        returns (bool)
    {
        return
            interfaceId == type(IERC721Upgradeable).interfaceId ||
            interfaceId == type(IERC721MetadataUpgradeable).interfaceId ||
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
}
