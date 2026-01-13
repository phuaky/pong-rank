// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PongRank
 * @notice A smart contract for tracking ping pong player rankings and match history
 * @dev Only the owner (server wallet) can write; anyone can read
 */
contract PongRank {
    // ============ Constants ============
    int256 public constant INITIAL_ELO = 1200;

    // ============ State Variables ============
    address public owner;
    
    // Player data
    struct Player {
        bytes32 id;
        int256 elo;
        uint256 wins;
        uint256 losses;
        bool exists;
    }
    
    // Match data
    struct Match {
        bytes32 id;
        bytes32[] winnerIds;
        bytes32[] loserIds;
        int256 eloChange;
        uint256 timestamp;
        bool exists;
    }
    
    // Storage mappings
    mapping(bytes32 => Player) private players;
    mapping(bytes32 => Match) private matches;
    
    // Arrays for enumeration
    bytes32[] private playerIds;
    bytes32[] private matchIds;

    // ============ Events ============
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

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "PongRank: caller is not the owner");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ============ Owner Functions ============
    
    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PongRank: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Register a new player with initial ELO of 1200
     * @param playerId Unique identifier for the player (UUID as bytes32)
     */
    function registerPlayer(bytes32 playerId) external onlyOwner {
        require(playerId != bytes32(0), "PongRank: invalid player ID");
        require(!players[playerId].exists, "PongRank: player already exists");
        
        players[playerId] = Player({
            id: playerId,
            elo: INITIAL_ELO,
            wins: 0,
            losses: 0,
            exists: true
        });
        
        playerIds.push(playerId);
        
        emit PlayerRegistered(playerId, INITIAL_ELO);
    }

    /**
     * @notice Log a match result and update player stats
     * @param matchId Unique identifier for the match
     * @param winnerIds Array of winner player IDs (1 for singles, 2 for doubles)
     * @param loserIds Array of loser player IDs (1 for singles, 2 for doubles)
     * @param eloChange The ELO points to transfer (calculated off-chain)
     */
    function logMatch(
        bytes32 matchId,
        bytes32[] calldata winnerIds,
        bytes32[] calldata loserIds,
        int256 eloChange
    ) external onlyOwner {
        require(matchId != bytes32(0), "PongRank: invalid match ID");
        require(!matches[matchId].exists, "PongRank: match already exists");
        require(winnerIds.length > 0 && winnerIds.length <= 2, "PongRank: invalid winner count");
        require(loserIds.length > 0 && loserIds.length <= 2, "PongRank: invalid loser count");
        require(winnerIds.length == loserIds.length, "PongRank: team size mismatch");
        require(eloChange >= 0, "PongRank: ELO change must be non-negative");
        
        // Validate all players exist
        for (uint256 i = 0; i < winnerIds.length; i++) {
            require(players[winnerIds[i]].exists, "PongRank: winner player not found");
        }
        for (uint256 i = 0; i < loserIds.length; i++) {
            require(players[loserIds[i]].exists, "PongRank: loser player not found");
        }
        
        // Store match
        matches[matchId].id = matchId;
        matches[matchId].eloChange = eloChange;
        matches[matchId].timestamp = block.timestamp;
        matches[matchId].exists = true;
        
        // Copy arrays to storage
        for (uint256 i = 0; i < winnerIds.length; i++) {
            matches[matchId].winnerIds.push(winnerIds[i]);
        }
        for (uint256 i = 0; i < loserIds.length; i++) {
            matches[matchId].loserIds.push(loserIds[i]);
        }
        
        matchIds.push(matchId);
        
        // Update winner stats
        for (uint256 i = 0; i < winnerIds.length; i++) {
            bytes32 winnerId = winnerIds[i];
            players[winnerId].elo += eloChange;
            players[winnerId].wins += 1;
            emit PlayerStatsUpdated(
                winnerId,
                players[winnerId].elo,
                players[winnerId].wins,
                players[winnerId].losses
            );
        }
        
        // Update loser stats
        for (uint256 i = 0; i < loserIds.length; i++) {
            bytes32 loserId = loserIds[i];
            players[loserId].elo -= eloChange;
            players[loserId].losses += 1;
            emit PlayerStatsUpdated(
                loserId,
                players[loserId].elo,
                players[loserId].wins,
                players[loserId].losses
            );
        }
        
        emit MatchLogged(matchId, winnerIds, loserIds, eloChange, block.timestamp);
    }

    /**
     * @notice Batch register multiple players
     * @param _playerIds Array of player IDs to register
     */
    function registerPlayersBatch(bytes32[] calldata _playerIds) external onlyOwner {
        for (uint256 i = 0; i < _playerIds.length; i++) {
            bytes32 playerId = _playerIds[i];
            require(playerId != bytes32(0), "PongRank: invalid player ID");
            
            if (!players[playerId].exists) {
                players[playerId] = Player({
                    id: playerId,
                    elo: INITIAL_ELO,
                    wins: 0,
                    losses: 0,
                    exists: true
                });
                playerIds.push(playerId);
                emit PlayerRegistered(playerId, INITIAL_ELO);
            }
        }
    }

    // ============ View Functions ============
    
    /**
     * @notice Get player data by ID
     * @param playerId The player's unique identifier
     * @return id Player ID
     * @return elo Current ELO rating
     * @return wins Total wins
     * @return losses Total losses
     * @return exists Whether the player exists
     */
    function getPlayer(bytes32 playerId) external view returns (
        bytes32 id,
        int256 elo,
        uint256 wins,
        uint256 losses,
        bool exists
    ) {
        Player storage p = players[playerId];
        return (p.id, p.elo, p.wins, p.losses, p.exists);
    }

    /**
     * @notice Get match data by ID
     * @param matchId The match's unique identifier
     * @return id Match ID
     * @return winnerIds Array of winner player IDs
     * @return loserIds Array of loser player IDs
     * @return eloChange ELO points exchanged
     * @return timestamp Block timestamp when match was logged
     * @return exists Whether the match exists
     */
    function getMatch(bytes32 matchId) external view returns (
        bytes32 id,
        bytes32[] memory winnerIds,
        bytes32[] memory loserIds,
        int256 eloChange,
        uint256 timestamp,
        bool exists
    ) {
        Match storage m = matches[matchId];
        return (m.id, m.winnerIds, m.loserIds, m.eloChange, m.timestamp, m.exists);
    }

    /**
     * @notice Check if a player exists
     * @param playerId The player's unique identifier
     * @return exists Whether the player exists
     */
    function playerExists(bytes32 playerId) external view returns (bool) {
        return players[playerId].exists;
    }

    /**
     * @notice Check if a match exists
     * @param matchId The match's unique identifier
     * @return exists Whether the match exists
     */
    function matchExists(bytes32 matchId) external view returns (bool) {
        return matches[matchId].exists;
    }

    /**
     * @notice Get the total number of registered players
     * @return count Total player count
     */
    function getPlayerCount() external view returns (uint256) {
        return playerIds.length;
    }

    /**
     * @notice Get the total number of logged matches
     * @return count Total match count
     */
    function getMatchCount() external view returns (uint256) {
        return matchIds.length;
    }

    /**
     * @notice Get all player IDs
     * @return Array of all player IDs
     */
    function getAllPlayerIds() external view returns (bytes32[] memory) {
        return playerIds;
    }

    /**
     * @notice Get all match IDs
     * @return Array of all match IDs
     */
    function getAllMatchIds() external view returns (bytes32[] memory) {
        return matchIds;
    }

    /**
     * @notice Get player IDs with pagination
     * @param offset Starting index
     * @param limit Maximum number of IDs to return
     * @return Array of player IDs
     */
    function getPlayerIdsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        if (offset >= playerIds.length) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > playerIds.length) {
            end = playerIds.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = playerIds[i];
        }
        
        return result;
    }

    /**
     * @notice Get match IDs with pagination
     * @param offset Starting index
     * @param limit Maximum number of IDs to return
     * @return Array of match IDs
     */
    function getMatchIdsPaginated(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        if (offset >= matchIds.length) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > matchIds.length) {
            end = matchIds.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = matchIds[i];
        }
        
        return result;
    }

    /**
     * @notice Get multiple players in a single call
     * @param _playerIds Array of player IDs to fetch
     * @return ids Array of player IDs
     * @return elos Array of player ELO ratings
     * @return wins Array of player win counts
     * @return losses Array of player loss counts
     */
    function getPlayersBatch(bytes32[] calldata _playerIds) external view returns (
        bytes32[] memory ids,
        int256[] memory elos,
        uint256[] memory wins,
        uint256[] memory losses
    ) {
        uint256 len = _playerIds.length;
        ids = new bytes32[](len);
        elos = new int256[](len);
        wins = new uint256[](len);
        losses = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            Player storage p = players[_playerIds[i]];
            ids[i] = p.id;
            elos[i] = p.elo;
            wins[i] = p.wins;
            losses[i] = p.losses;
        }
        
        return (ids, elos, wins, losses);
    }
}
