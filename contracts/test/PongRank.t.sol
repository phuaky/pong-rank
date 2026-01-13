// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PongRank} from "../src/PongRank.sol";

contract PongRankTest is Test {
    PongRank public pongRank;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    bytes32 public player1Id = keccak256("player1");
    bytes32 public player2Id = keccak256("player2");
    bytes32 public player3Id = keccak256("player3");
    bytes32 public player4Id = keccak256("player4");
    
    bytes32 public match1Id = keccak256("match1");
    bytes32 public match2Id = keccak256("match2");

    event PlayerRegistered(bytes32 indexed playerId, int256 initialElo);
    event MatchLogged(
        bytes32 indexed matchId,
        bytes32[] winnerIds,
        bytes32[] loserIds,
        int256 eloChange,
        uint256 timestamp
    );
    event PlayerStatsUpdated(bytes32 indexed playerId, int256 newElo, uint256 wins, uint256 losses);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        pongRank = new PongRank();
    }

    // ============ Constructor Tests ============
    
    function test_Constructor_SetsOwner() public view {
        assertEq(pongRank.owner(), owner);
    }

    function test_Constructor_InitialEloConstant() public view {
        assertEq(pongRank.INITIAL_ELO(), 1200);
    }

    // ============ Player Registration Tests ============
    
    function test_RegisterPlayer_Success() public {
        vm.expectEmit(true, false, false, true);
        emit PlayerRegistered(player1Id, 1200);
        
        pongRank.registerPlayer(player1Id);
        
        (bytes32 id, int256 elo, uint256 wins, uint256 losses, bool exists) = pongRank.getPlayer(player1Id);
        
        assertEq(id, player1Id);
        assertEq(elo, 1200);
        assertEq(wins, 0);
        assertEq(losses, 0);
        assertTrue(exists);
    }

    function test_RegisterPlayer_IncreasesPlayerCount() public {
        assertEq(pongRank.getPlayerCount(), 0);
        
        pongRank.registerPlayer(player1Id);
        assertEq(pongRank.getPlayerCount(), 1);
        
        pongRank.registerPlayer(player2Id);
        assertEq(pongRank.getPlayerCount(), 2);
    }

    function test_RegisterPlayer_RevertOnDuplicate() public {
        pongRank.registerPlayer(player1Id);
        
        vm.expectRevert("PongRank: player already exists");
        pongRank.registerPlayer(player1Id);
    }

    function test_RegisterPlayer_RevertOnZeroId() public {
        vm.expectRevert("PongRank: invalid player ID");
        pongRank.registerPlayer(bytes32(0));
    }

    function test_RegisterPlayer_RevertOnNonOwner() public {
        vm.prank(user1);
        vm.expectRevert("PongRank: caller is not the owner");
        pongRank.registerPlayer(player1Id);
    }

    // ============ Batch Registration Tests ============
    
    function test_RegisterPlayersBatch_Success() public {
        bytes32[] memory playerIdsBatch = new bytes32[](3);
        playerIdsBatch[0] = player1Id;
        playerIdsBatch[1] = player2Id;
        playerIdsBatch[2] = player3Id;
        
        pongRank.registerPlayersBatch(playerIdsBatch);
        
        assertEq(pongRank.getPlayerCount(), 3);
        assertTrue(pongRank.playerExists(player1Id));
        assertTrue(pongRank.playerExists(player2Id));
        assertTrue(pongRank.playerExists(player3Id));
    }

    function test_RegisterPlayersBatch_SkipExisting() public {
        pongRank.registerPlayer(player1Id);
        
        bytes32[] memory playerIdsBatch = new bytes32[](2);
        playerIdsBatch[0] = player1Id; // Already exists
        playerIdsBatch[1] = player2Id;
        
        pongRank.registerPlayersBatch(playerIdsBatch);
        
        assertEq(pongRank.getPlayerCount(), 2); // Only 2, not 3
    }

    function test_RegisterPlayersBatch_RevertOnZeroId() public {
        bytes32[] memory playerIdsBatch = new bytes32[](2);
        playerIdsBatch[0] = player1Id;
        playerIdsBatch[1] = bytes32(0);
        
        vm.expectRevert("PongRank: invalid player ID");
        pongRank.registerPlayersBatch(playerIdsBatch);
    }

    // ============ Singles Match Tests ============
    
    function test_LogMatch_Singles_Success() public {
        // Register players
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        int256 eloChange = 16;
        
        pongRank.logMatch(match1Id, winners, losers, eloChange);
        
        // Check match was logged
        (
            bytes32 id,
            bytes32[] memory winnerIds,
            bytes32[] memory loserIds,
            int256 change,
            uint256 timestamp,
            bool exists
        ) = pongRank.getMatch(match1Id);
        
        assertEq(id, match1Id);
        assertEq(winnerIds.length, 1);
        assertEq(winnerIds[0], player1Id);
        assertEq(loserIds.length, 1);
        assertEq(loserIds[0], player2Id);
        assertEq(change, eloChange);
        assertTrue(timestamp > 0);
        assertTrue(exists);
    }

    function test_LogMatch_Singles_UpdatesElo() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        int256 eloChange = 16;
        
        pongRank.logMatch(match1Id, winners, losers, eloChange);
        
        // Check winner stats
        (, int256 winnerElo, uint256 winnerWins, uint256 winnerLosses,) = pongRank.getPlayer(player1Id);
        assertEq(winnerElo, 1200 + 16);
        assertEq(winnerWins, 1);
        assertEq(winnerLosses, 0);
        
        // Check loser stats
        (, int256 loserElo, uint256 loserWins, uint256 loserLosses,) = pongRank.getPlayer(player2Id);
        assertEq(loserElo, 1200 - 16);
        assertEq(loserWins, 0);
        assertEq(loserLosses, 1);
    }

    // ============ Doubles Match Tests ============
    
    function test_LogMatch_Doubles_Success() public {
        // Register 4 players
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        pongRank.registerPlayer(player3Id);
        pongRank.registerPlayer(player4Id);
        
        bytes32[] memory winners = new bytes32[](2);
        winners[0] = player1Id;
        winners[1] = player2Id;
        
        bytes32[] memory losers = new bytes32[](2);
        losers[0] = player3Id;
        losers[1] = player4Id;
        
        int256 eloChange = 20;
        
        pongRank.logMatch(match1Id, winners, losers, eloChange);
        
        // Check match count
        assertEq(pongRank.getMatchCount(), 1);
        
        // Check all 4 players updated
        (, int256 p1Elo, uint256 p1Wins,,) = pongRank.getPlayer(player1Id);
        (, int256 p2Elo, uint256 p2Wins,,) = pongRank.getPlayer(player2Id);
        (, int256 p3Elo,, uint256 p3Losses,) = pongRank.getPlayer(player3Id);
        (, int256 p4Elo,, uint256 p4Losses,) = pongRank.getPlayer(player4Id);
        
        assertEq(p1Elo, 1220);
        assertEq(p2Elo, 1220);
        assertEq(p3Elo, 1180);
        assertEq(p4Elo, 1180);
        
        assertEq(p1Wins, 1);
        assertEq(p2Wins, 1);
        assertEq(p3Losses, 1);
        assertEq(p4Losses, 1);
    }

    // ============ Match Validation Tests ============
    
    function test_LogMatch_RevertOnDuplicateMatch() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        pongRank.logMatch(match1Id, winners, losers, 16);
        
        vm.expectRevert("PongRank: match already exists");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnZeroMatchId() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        vm.expectRevert("PongRank: invalid match ID");
        pongRank.logMatch(bytes32(0), winners, losers, 16);
    }

    function test_LogMatch_RevertOnEmptyWinners() public {
        pongRank.registerPlayer(player1Id);
        
        bytes32[] memory winners = new bytes32[](0);
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player1Id;
        
        vm.expectRevert("PongRank: invalid winner count");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnTooManyWinners() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        pongRank.registerPlayer(player3Id);
        
        bytes32[] memory winners = new bytes32[](3);
        winners[0] = player1Id;
        winners[1] = player2Id;
        winners[2] = player3Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player1Id;
        
        vm.expectRevert("PongRank: invalid winner count");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnTeamSizeMismatch() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        pongRank.registerPlayer(player3Id);
        
        bytes32[] memory winners = new bytes32[](2);
        winners[0] = player1Id;
        winners[1] = player2Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player3Id;
        
        vm.expectRevert("PongRank: team size mismatch");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnNegativeEloChange() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        vm.expectRevert("PongRank: ELO change must be non-negative");
        pongRank.logMatch(match1Id, winners, losers, -10);
    }

    function test_LogMatch_RevertOnNonExistentWinner() public {
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id; // Not registered
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        vm.expectRevert("PongRank: winner player not found");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnNonExistentLoser() public {
        pongRank.registerPlayer(player1Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id; // Not registered
        
        vm.expectRevert("PongRank: loser player not found");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    function test_LogMatch_RevertOnNonOwner() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        vm.prank(user1);
        vm.expectRevert("PongRank: caller is not the owner");
        pongRank.logMatch(match1Id, winners, losers, 16);
    }

    // ============ Multiple Matches Tests ============
    
    function test_MultipleMatches_EloAccumulates() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        // Player 1 wins 3 matches
        pongRank.logMatch(keccak256("match1"), winners, losers, 16);
        pongRank.logMatch(keccak256("match2"), winners, losers, 14);
        pongRank.logMatch(keccak256("match3"), winners, losers, 12);
        
        // Player 2 wins 1 match
        winners[0] = player2Id;
        losers[0] = player1Id;
        pongRank.logMatch(keccak256("match4"), winners, losers, 18);
        
        (, int256 p1Elo, uint256 p1Wins, uint256 p1Losses,) = pongRank.getPlayer(player1Id);
        (, int256 p2Elo, uint256 p2Wins, uint256 p2Losses,) = pongRank.getPlayer(player2Id);
        
        // Player 1: 1200 + 16 + 14 + 12 - 18 = 1224
        assertEq(p1Elo, 1224);
        assertEq(p1Wins, 3);
        assertEq(p1Losses, 1);
        
        // Player 2: 1200 - 16 - 14 - 12 + 18 = 1176
        assertEq(p2Elo, 1176);
        assertEq(p2Wins, 1);
        assertEq(p2Losses, 3);
        
        assertEq(pongRank.getMatchCount(), 4);
    }

    // ============ Ownership Tests ============
    
    function test_TransferOwnership_Success() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, user1);
        
        pongRank.transferOwnership(user1);
        
        assertEq(pongRank.owner(), user1);
    }

    function test_TransferOwnership_NewOwnerCanAct() public {
        pongRank.transferOwnership(user1);
        
        vm.prank(user1);
        pongRank.registerPlayer(player1Id);
        
        assertTrue(pongRank.playerExists(player1Id));
    }

    function test_TransferOwnership_OldOwnerCannotAct() public {
        pongRank.transferOwnership(user1);
        
        vm.expectRevert("PongRank: caller is not the owner");
        pongRank.registerPlayer(player1Id);
    }

    function test_TransferOwnership_RevertOnZeroAddress() public {
        vm.expectRevert("PongRank: new owner is zero address");
        pongRank.transferOwnership(address(0));
    }

    function test_TransferOwnership_RevertOnNonOwner() public {
        vm.prank(user1);
        vm.expectRevert("PongRank: caller is not the owner");
        pongRank.transferOwnership(user2);
    }

    // ============ View Function Tests ============
    
    function test_PlayerExists_ReturnsCorrectly() public {
        assertFalse(pongRank.playerExists(player1Id));
        
        pongRank.registerPlayer(player1Id);
        
        assertTrue(pongRank.playerExists(player1Id));
    }

    function test_MatchExists_ReturnsCorrectly() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        assertFalse(pongRank.matchExists(match1Id));
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        pongRank.logMatch(match1Id, winners, losers, 16);
        
        assertTrue(pongRank.matchExists(match1Id));
    }

    function test_GetAllPlayerIds() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        pongRank.registerPlayer(player3Id);
        
        bytes32[] memory allIds = pongRank.getAllPlayerIds();
        
        assertEq(allIds.length, 3);
        assertEq(allIds[0], player1Id);
        assertEq(allIds[1], player2Id);
        assertEq(allIds[2], player3Id);
    }

    function test_GetAllMatchIds() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        pongRank.logMatch(match1Id, winners, losers, 16);
        pongRank.logMatch(match2Id, winners, losers, 14);
        
        bytes32[] memory allIds = pongRank.getAllMatchIds();
        
        assertEq(allIds.length, 2);
        assertEq(allIds[0], match1Id);
        assertEq(allIds[1], match2Id);
    }

    // ============ Pagination Tests ============
    
    function test_GetPlayerIdsPaginated() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        pongRank.registerPlayer(player3Id);
        pongRank.registerPlayer(player4Id);
        
        // Get first 2
        bytes32[] memory page1 = pongRank.getPlayerIdsPaginated(0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], player1Id);
        assertEq(page1[1], player2Id);
        
        // Get next 2
        bytes32[] memory page2 = pongRank.getPlayerIdsPaginated(2, 2);
        assertEq(page2.length, 2);
        assertEq(page2[0], player3Id);
        assertEq(page2[1], player4Id);
        
        // Get beyond end
        bytes32[] memory page3 = pongRank.getPlayerIdsPaginated(4, 2);
        assertEq(page3.length, 0);
    }

    function test_GetMatchIdsPaginated() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        pongRank.logMatch(keccak256("m1"), winners, losers, 16);
        pongRank.logMatch(keccak256("m2"), winners, losers, 16);
        pongRank.logMatch(keccak256("m3"), winners, losers, 16);
        
        bytes32[] memory page1 = pongRank.getMatchIdsPaginated(0, 2);
        assertEq(page1.length, 2);
        
        bytes32[] memory page2 = pongRank.getMatchIdsPaginated(2, 2);
        assertEq(page2.length, 1);
    }

    // ============ Batch Get Tests ============
    
    function test_GetPlayersBatch() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        // Log a match to change stats
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        pongRank.logMatch(match1Id, winners, losers, 20);
        
        // Batch get
        bytes32[] memory idsToFetch = new bytes32[](2);
        idsToFetch[0] = player1Id;
        idsToFetch[1] = player2Id;
        
        (
            bytes32[] memory ids,
            int256[] memory elos,
            uint256[] memory wins,
            uint256[] memory losses
        ) = pongRank.getPlayersBatch(idsToFetch);
        
        assertEq(ids[0], player1Id);
        assertEq(elos[0], 1220);
        assertEq(wins[0], 1);
        assertEq(losses[0], 0);
        
        assertEq(ids[1], player2Id);
        assertEq(elos[1], 1180);
        assertEq(wins[1], 0);
        assertEq(losses[1], 1);
    }

    // ============ Edge Case: Negative ELO ============
    
    function test_EloCanGoNegative() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        // Player 2 loses many times with large ELO changes
        for (uint256 i = 0; i < 50; i++) {
            pongRank.logMatch(keccak256(abi.encodePacked("match", i)), winners, losers, 30);
        }
        
        (, int256 p2Elo,,,) = pongRank.getPlayer(player2Id);
        
        // 1200 - (30 * 50) = 1200 - 1500 = -300
        assertEq(p2Elo, -300);
    }

    // ============ Events Tests ============
    
    function test_EmitsPlayerStatsUpdatedOnMatch() public {
        pongRank.registerPlayer(player1Id);
        pongRank.registerPlayer(player2Id);
        
        bytes32[] memory winners = new bytes32[](1);
        winners[0] = player1Id;
        
        bytes32[] memory losers = new bytes32[](1);
        losers[0] = player2Id;
        
        vm.expectEmit(true, false, false, true);
        emit PlayerStatsUpdated(player1Id, 1216, 1, 0);
        
        vm.expectEmit(true, false, false, true);
        emit PlayerStatsUpdated(player2Id, 1184, 0, 1);
        
        pongRank.logMatch(match1Id, winners, losers, 16);
    }
}
