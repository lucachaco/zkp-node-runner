pragma solidity >=0.5.7;

/**
 * @title OpsCoinToken receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from OCT contracts.
 */

interface IOCTReceiver {
    /**
     * @notice Handle the receipt of OCT Fungible Tokens
     * @dev The OpsCoinToken smart contract calls this function on the recipient
     * after a `safeTransferFrom`. This function MUST return the function selector,
     * otherwise the caller will revert the transaction. The selector to be
     * returned can be obtained as `this.onOCTReceived.selector`. This
     * function MAY throw to revert and reject the transfer.
     * Note: the OpsCoinToken contract address is always the message sender.
     * @param operator The address which called `safeTransferFrom` function
     * @param from The address which previously owned the tokens
     * @param amount The amount of OCT which is being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onOCTReceived(address,address,uint256,bytes)"))`
     */
    function onOCTReceived(address operator, address from, uint256 amount, bytes calldata data) external returns (bytes4);
}
