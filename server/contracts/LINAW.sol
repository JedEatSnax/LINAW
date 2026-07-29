// SPDX-License-Identifier: AGPL-3.0
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title LINAW Asset Tokenization Smart Contract
 * @author github.com/JedEatSnax
 * @author github.com/Wiii-1
 * @notice ERC-1155 asset tokenization contract for LINAW inventory. NOT FINAL
 */
contract LINAW is ERC1155, ERC1155Pausable, AccessControl, ERC1155Burnable, ERC1155Supply {
    /// @notice Role allowed to pause and unpause token transfers.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    /// @notice Role allowed to register assets and mint inventory.
    bytes32 public constant PROCUREMENT_ROLE = keccak256("PROCUREMENT_ROLE");

    uint256 private _nextTokenId = 1;

    /// @notice Tracks whether an asset type has been registered
    mapping(uint256 => bool) public assetExists;

    /// @notice Emitted when a new asset type is registered.
    /// @param tokenId The token ID assigned to the asset type
    event AssetRegistered(
        uint256 indexed tokenId
    );

    /**
     * @notice Emitted when inventory is minted for an asset type
     * 
     * @param tokenId The token ID that was minted
     * @param recipient The token ID that was minted
     * @param amount The token ID that was minted
     */
    event InventoryMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed amount
    );

    /**
     * @notice Thrown when minting is attempted for an unregistered asset type
     * 
     * @param tokenId The token ID that was not found
     */
    error AssetNotRegistered(uint256 tokenId);

    /**
     * @notice Deploys the contract and assigns the initial roles
     * 
     * @param defaultAdmin Address granted the default admin role
     * @param pauser Address granted the pauser role
     * @param procurement Address granted the procurement role
     */
    constructor(
        address defaultAdmin,
        address pauser,
        address procurement
    )
        ERC1155("https://linaw.tech/api/token/{id}")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(PROCUREMENT_ROLE, procurement);
    }

    /// @notice Pauses all token transfers.
    function pause()
        public
        onlyRole(PAUSER_ROLE)
    {
        _pause();
    }

    /// @notice Unpauses all token transfers
    function unpause()
        public
        onlyRole(PAUSER_ROLE)
    {
        _unpause();
    }

    /**
     * @notice Register a new asset type.
     *
     * Example:
     * Token ID 1 = Cisco Catalyst 8300-2N2S-4T2X
     * Token ID 2 = Dell Latitude 5450
     *
     * @return tokenId The newly registered token ID
     */
    function registerAsset()
        public
        onlyRole(PROCUREMENT_ROLE)
        returns (uint256 tokenId)
    {
        tokenId = _nextTokenId;
        ++_nextTokenId;

        assetExists[tokenId] = true;

        emit AssetRegistered(tokenId);
    }

    /**
     * @notice Mint inventory for an existing asset type
     *
     * Example:
     * Token ID 1 (Copper)
     * +500 units
     *
     * @param recipient The address that receives the minted inventory
     * @param tokenId The registered token ID to mint
     * @param amount The amount to mint
     * @param data Additional mint data
     */
    function mintInventory(
        address recipient,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    )
        public
        onlyRole(PROCUREMENT_ROLE)
    {
        if (!assetExists[tokenId]) {
            revert AssetNotRegistered(tokenId);
        }

        _mint(
            recipient,
            tokenId,
            amount,
            data
        );

        emit InventoryMinted(
            tokenId,
            recipient,
            amount
        );
    }

    /**
     * @notice Mint inventory for multiple asset types
     *
     * @param recipient The address that receives the minted inventory
     * @param tokenIds The registered token IDs to mint
     * @param amounts The amounts to mint for each token ID
     * @param data Additional mint data
     */
    function mintInventoryBatch(
        address recipient,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    )
        public
        onlyRole(PROCUREMENT_ROLE)
    {
        for (uint256 i = 0; i < tokenIds.length; ++i) {
            if (!assetExists[tokenIds[i]]) {
                revert AssetNotRegistered(tokenIds[i]);
            }

            emit InventoryMinted(
                tokenIds[i],
                recipient,
                amounts[i]
            );
        }

        _mintBatch(
            recipient,
            tokenIds,
            amounts,
            data
        );
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    )
        internal
        override(
            ERC1155,
            ERC1155Pausable,
            ERC1155Supply
        )
    {
        super._update(
            from,
            to,
            ids,
            values
        );
    }

    /**
     * @notice Returns whether the contract supports a given interface
     * 
     * @param interfaceId The interface identifier to check
     * @return supported True if the interface is supported
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC1155,
            AccessControl
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}