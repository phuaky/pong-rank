// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PongRank} from "../src/PongRank.sol";

/**
 * @title Deploy
 * @notice Deployment script for PongRank contract
 * @dev Usage:
 *      1. Set environment variables:
 *         - SIGNER_PRIVATE_KEY: Private key of deployer wallet
 *         - SEPOLIA_RPC_URL: Sepolia RPC endpoint
 *      
 *      2. Run deployment:
 *         forge script script/Deploy.s.sol:DeployPongRank --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 *      
 *      3. For local testing:
 *         forge script script/Deploy.s.sol:DeployPongRank --fork-url $SEPOLIA_RPC_URL
 */
contract DeployPongRank is Script {
    function setUp() public {}

    function run() public returns (PongRank) {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("SIGNER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PongRank contract...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PongRank pongRank = new PongRank();
        
        vm.stopBroadcast();
        
        console.log("PongRank deployed to:", address(pongRank));
        console.log("Owner:", pongRank.owner());
        
        return pongRank;
    }
}

/**
 * @title DeployLocal
 * @notice Deployment script for local testing with Anvil
 * @dev Usage: forge script script/Deploy.s.sol:DeployLocal --fork-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
    // Default Anvil private key (DO NOT USE IN PRODUCTION)
    uint256 constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    
    function run() public returns (PongRank) {
        console.log("Deploying PongRank to local Anvil...");
        
        vm.startBroadcast(ANVIL_PRIVATE_KEY);
        
        PongRank pongRank = new PongRank();
        
        vm.stopBroadcast();
        
        console.log("PongRank deployed to:", address(pongRank));
        
        return pongRank;
    }
}
