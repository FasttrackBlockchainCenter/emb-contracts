// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract embSalev1 is AccessControlUpgradeable, ERC2771ContextUpgradeable, UUPSUpgradeable {
    using AddressUpgradeable for address;
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC721Upgradeable private _nft;

    IERC20Upgradeable private _token;

    struct Sale {
        uint256 nftId;
        uint256 price;
        address owner;
        bool isActive;
    }

    bytes32 public constant OWNER = keccak256("OWNER");

    bytes32 public constant ADMIN = keccak256("ADMIN");

    mapping(uint256 => Sale) private _nftSales;

    event AdminAccessSet(address _minter, bool _enabled);

    event SaleAdded(uint256 _nftId, uint256 _price, address _owner, uint256 _timestamp);

    event SaleCancelled(uint256 _nftId, uint256 _price, address _owner, address _cancelledBy, uint256 _timestamp);

    event Sold(uint256 _nftId, address _seller, address _buyer, uint256 _price, uint256 _timestamp);

    modifier isValidSell(uint256 nftId) {
        require(_nft.ownerOf(nftId) == _msgSender(), "Only owner of NFT can sell");
        require(_nft.getApproved(nftId) == address(this), "Grant NFT approval to Sale Contract");
        require(!_nftSales[nftId].isActive, "NFT Sale is active");
        _;
    }

    modifier isValidSellParcel(uint256[] memory nftIds, uint256[] memory prices) {
        require(nftIds.length == prices.length, "Quantity Mismatch");
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            require(_nft.ownerOf(nftId) == _msgSender(), "Only owner of NFT can sell");
            require(_nft.getApproved(nftId) == address(this), "Grant NFT approval to Sale Contract");
            require(!_nftSales[nftId].isActive, "NFT Sale is active");
        }
        _;
    }

    modifier isValidCancel(uint256 nftId) {
        require(
            (_nftSales[nftId].owner == _msgSender()) || (hasRole(OWNER, _msgSender())),
            "Only owner/admin can cancel Sale"
        );
        require(_nftSales[nftId].isActive, "NFT is not up for sale");
        _;
    }

    modifier isValidPurchase(uint256 nftId, address buyer) {
        require(_nftSales[nftId].isActive, "NFT is not for sale");
        require(
            _token.allowance(buyer, address(this)) >= _nftSales[nftId].price,
            "Grant token approval to Sale Contract"
        );
        _;
    }

    modifier isNotNullAddress(address _addr) {
        require(_addr != address(0), "Address is null");
        _;
    }

    modifier isValidPurchaseParcel(uint256[] memory nftIds, address buyer) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            totalAmount = totalAmount.add(_nftSales[nftId].price);
        }
        require(_token.allowance(buyer, address(this)) >= totalAmount, "Grant token approval to Sale Contract");
        _;
    }

    /**
     * This function acts as the constructor
     *
     */
    function initialize(
        IERC721Upgradeable _nftAddress,
        IERC20Upgradeable _tokenAddress,
        address _forwarder
    ) public virtual initializer {
        __AccessControl_init();
        __ERC2771Context_init(_forwarder);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(ADMIN, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(OWNER, DEFAULT_ADMIN_ROLE);

        _nft = _nftAddress;
        _token = _tokenAddress;
    }

    function updateForwarder(address _newForwarder) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _trustedForwarder = _newForwarder;
    }

    function iSaleProperty(uint256 nftId, uint256 price) internal virtual {
        _nftSales[nftId] = Sale(nftId, price, _msgSender(), true);
        _nft.transferFrom(_msgSender(), address(this), nftId);
        emit SaleAdded(nftId, price, _msgSender(), block.timestamp);
    }

    /**
     * Put up Property for Sale
     *
     * @param nftId - nftId of the property
     * @param price - price to sell property for
     */
    function sellProperty(uint256 nftId, uint256 price) public virtual isValidSell(nftId) {
        iSaleProperty(nftId, price);
    }

    /**
     * Put up Property for Sale
     *
     * @param nftIds - nftIds of the property
     * @param prices - prices to sell property for
     */
    function sellPropertyParcel(uint256[] memory nftIds, uint256[] memory prices)
        public
        virtual
        isValidSellParcel(nftIds, prices)
    {
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            uint256 price = prices[i];
            iSaleProperty(nftId, price);
        }
    }

    /**
     * Get Property Sale
     *
     * @param nftId - nftId of the property
     */
    function getSale(uint256 nftId) public view virtual returns (address, uint256) {
        return (_nftSales[nftId].owner, _nftSales[nftId].price);
    }

    /**
     * Cancel Property Sale
     *
     * @param nftId - nftId of the property
     */
    function cancelSale(uint256 nftId) public virtual isValidCancel(nftId) {
        // Instead of line 164
        _nftSales[nftId].isActive = false;
        _nft.transferFrom(address(this), _nftSales[nftId].owner, nftId);
        emit SaleCancelled(nftId, _nftSales[nftId].price, _nftSales[nftId].owner, _msgSender(), block.timestamp);
    }

    function iPurchaseProperty(
        uint256 nftId,
        address buyer,
        address seller,
        uint256 price
    ) internal virtual {
        _nftSales[nftId] = Sale(0, 0, address(0), false);
        _token.transferFrom(buyer, seller, price);
        _nft.transferFrom(address(this), buyer, nftId);
        emit Sold(nftId, seller, buyer, price, block.timestamp);
    }

    /**
     * Purchase Property
     *
     * @param nftId - nftId of the property
     */
    function purchaseProperty(uint256 nftId, address buyer)
        public
        virtual
        isValidPurchase(nftId, buyer)
        onlyRole(ADMIN)
        isNotNullAddress(buyer)
    {
        iPurchaseProperty(nftId, buyer, _nftSales[nftId].owner, _nftSales[nftId].price);
    }

    /**
     * Purchase Parcel of properties
     *
     * @param nftIds - nftIds of the property
     */
    function purchaseParcel(uint256[] memory nftIds, address buyer)
        public
        virtual
        isValidPurchaseParcel(nftIds, buyer)
        onlyRole(ADMIN)
    {
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 nftId = nftIds[i];
            iPurchaseProperty(nftId, buyer, _nftSales[nftId].owner, _nftSales[nftId].price);
        }
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
