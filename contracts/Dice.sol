// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract DiceRoller {
    struct Roll {
        uint8 value1; // Value of the first dice
        uint8 value2; // Value of the second dice
    }

    struct PlayerData {
        Roll[] rolls; // Array to store all rolls for a player
        uint8 point; // The point number if established
        string outcome; // Outcome of the most recent roll
        uint256 balance; // Player's balance in the contract        
    }

    uint256 nonce; // Nonce to ensure randomness in dice roll
    mapping(address => PlayerData) public playerData;
    address public admin; // Admin address for withdrawals

    event DiceRolled(address indexed player, uint8 value1, uint8 value2, string outcome);
    event Withdrawal(address indexed player, uint256 amount);
    event Deposit(address indexed player, uint256 amount);
    event FundsAdded(address indexed sender, uint256 amount);
    event AdminWithdrawal(address indexed admin, uint256 amount);

    uint256 constant ROLL_COST = 0.0003 ether;

    // Constructor to set the admin address
    constructor(address _admin) {
        admin = _admin;
    }

    // Function to roll two dice and apply Pass Line Bet rules
    function rollDice() public payable {
        require(msg.value == ROLL_COST, "You must send exactly 0.0003 ETH to roll the dice");

        playerData[msg.sender].balance += msg.value;
        emit Deposit(msg.sender, msg.value);

        // Generate two random numbers between 1 and 6
        uint8 value1 = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, nonce++))) % 6 + 1);
        uint8 value2 = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, nonce++))) % 6 + 1);
        uint8 sum = value1 + value2; // Sum of the two dice values

        string memory outcome;
        if (playerData[msg.sender].point == 0) { // Come-out roll
            // Clear the previous rolls for the player on a come-out roll
            delete playerData[msg.sender].rolls;

            if (sum == 7 || sum == 11) {
                outcome = "WIN";
                playerData[msg.sender].point = 0; // Reset the point
                // Payout logic for win
                uint256 payout = playerData[msg.sender].balance * 2;
                require(address(this).balance >= payout, "Contract does not have enough funds");
                playerData[msg.sender].balance = 0;
                payable(msg.sender).transfer(payout);
                emit Withdrawal(msg.sender, payout);                
            } else if (sum == 2 || sum == 3 || sum == 12) {
                outcome = "LOSE";
                playerData[msg.sender].point = 0; // Reset the point
                playerData[msg.sender].balance = 0;
            } else {
                playerData[msg.sender].point = sum; // Establish the point
                outcome = "ROLL";
            }
        } else { // Point is established
            if (sum == playerData[msg.sender].point) {
                outcome = "WIN";
                playerData[msg.sender].point = 0; // Reset the point
                // Payout logic for win
                uint256 payout = playerData[msg.sender].balance * 2;
                require(address(this).balance >= payout, "Contract does not have enough funds");
                playerData[msg.sender].balance = 0;
                payable(msg.sender).transfer(payout);
                emit Withdrawal(msg.sender, payout);                
            } else if (sum == 7) {
                outcome = "LOSE";
                playerData[msg.sender].point = 0; // Reset the point
            } else {
                outcome = "ROLL";
            }
        }

        // Set the outcome on the PlayerData struct
        playerData[msg.sender].outcome = outcome;

        // Create a new Roll struct without the outcome and add it to the rolls array
        Roll memory newRoll = Roll(value1, value2);
        playerData[msg.sender].rolls.push(newRoll);

        emit DiceRolled(msg.sender, value1, value2, outcome);
    }

    // Function to look up all dice rolls for an address
    function getRollsForAddress(address playerAddress) public view returns (PlayerData memory) {
        return playerData[playerAddress];
    }

    // Function to allow anyone to deposit funds into the contract
    function depositFunds() external payable {
        require(msg.value > 0, "Must send some ether");
        emit FundsAdded(msg.sender, msg.value);
    }

    // Function to allow only the admin to withdraw funds
    function withdrawFunds(uint256 amount) external {
        require(msg.sender == admin, "Only admin can withdraw funds");
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(admin).transfer(amount);
        emit AdminWithdrawal(admin, amount);
    }    
}
