import { useState, useEffect } from 'react';
import { useAccount, useEstimateGas, useReadContract, useWriteContract, useWatchContractEvent} from 'wagmi'
import { parseEther } from 'viem'
import Overlay from './Overlay'; // Import the Overlay component
import './read-contract.css'; // You'll create this CSS file to style the overlay

const contractABI = [{"inputs":[{"internalType":"address","name":"_admin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"AdminWithdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint8","name":"value1","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"value2","type":"uint8"},{"indexed":false,"internalType":"string","name":"outcome","type":"string"}],"name":"DiceRolled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"FundsAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"depositFunds","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"playerAddress","type":"address"}],"name":"getRollsForAddress","outputs":[{"components":[{"components":[{"internalType":"uint8","name":"value1","type":"uint8"},{"internalType":"uint8","name":"value2","type":"uint8"}],"internalType":"struct DiceRoller.Roll[]","name":"rolls","type":"tuple[]"},{"internalType":"uint8","name":"point","type":"uint8"},{"internalType":"string","name":"outcome","type":"string"},{"internalType":"uint256","name":"balance","type":"uint256"}],"internalType":"struct DiceRoller.PlayerData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerData","outputs":[{"internalType":"uint8","name":"point","type":"uint8"},{"internalType":"string","name":"outcome","type":"string"},{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rollDice","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}]

export function ReadContract(config: any) {
    //console.log('config: ', config)
    //console.log('ReadContract ... ')
    //console.log(config.config.chains)
    const { address } = useAccount()
    const [outcome, setOutcome] = useState<string | null>(null);
    const [lastRollDice1, setLastRollDice1] = useState<number | null>(null);
    const [lastRollDice2, setLastRollDice2] = useState<number | null>(null);
    const [allRolls, setAllRolls] = useState<object | string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    const [tempOutcome, setTempOutcome] = useState<string | null>(null);
    const [tempLastRollDice1, setTempLastRollDice1] = useState<number | null>(null);
    const [tempLastRollDice2, setTempLastRollDice2] = useState<number | null>(null);

    const { writeContractAsync } = useWriteContract()
    const { data, refetch } = useReadContract({
        abi: contractABI,
        address: '0x61E96a002c40e29c68bD679dA7f48Aaea3F317a0',
        functionName: 'getRollsForAddress',
        args: [address],
      }); 

    useEffect(() => {
        if (data) {
            setAllRolls(data);
        }
    }, [data]);

    useEffect(() => {
        if (countdown === 0) {
            // Update the state with the delayed values after countdown finishes
            setOutcome(tempOutcome);
            setLastRollDice1(tempLastRollDice1);
            setLastRollDice2(tempLastRollDice2);
            setCountdown(null); // Reset the countdown
        } else if (countdown !== null) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);  
 
    interface DiceRolledEvent {
        outcome: string;
        player: string;
        value1: number;
        value2: number;
    }
    
    // Listen for the DiceRolled event
    useWatchContractEvent({
        abi: contractABI,
        address: '0x61E96a002c40e29c68bD679dA7f48Aaea3F317a0',
        eventName: 'DiceRolled',
        onError(error) {
            console.error('Error listening for events', error);
        },
        onLogs(logs) {
            const diceRolledLogs = logs as unknown as Array<{ args: DiceRolledEvent }>;
            // Temporarily store the values, but don't update the state yet
            setTempOutcome(diceRolledLogs[0].args.outcome);
            setTempLastRollDice1(diceRolledLogs[0].args.value1);
            setTempLastRollDice2(diceRolledLogs[0].args.value2);
        },
    });       

    

    const { data: estimatedGas, refetch: estimateGas } = useEstimateGas({
        data: '0x837e7cc6',       
        to: '0x61E96a002c40e29c68bD679dA7f48Aaea3F317a0',
        value: parseEther('0.0003'), // If your function requires sending ETH
      });

    const handleRollDice = async () => {
        try {

            // Trigger the contract call immediately
            await writeContractAsync({
                abi: contractABI,
                address: '0x61E96a002c40e29c68bD679dA7f48Aaea3F317a0',
                functionName: 'rollDice',
                value: parseEther('0.0003'),
                gas: (estimatedGas ?? BigInt(100000)) * BigInt(2),                       
            });
            setCountdown(3); // Start countdown    
        } catch (error) {
            console.error('Transaction failed:', error);
            // Handle any errors here
        }
    };

    return (
        <div>
            <Overlay countdown={countdown} /> {/* Overlay component */}            
            <hr></hr>
            <br></br>
            <div className="button-container">
            <button className="roll-dice-button"
                onClick={handleRollDice}
                disabled={countdown !== null} // Disable button while countdown is active
            >
                {countdown !== null ? `Rolling ${countdown}...` : 'Roll Dice'}
            </button>
            </div>
            <br></br>
            <hr></hr>
            <div className="roll-outcome">
            {outcome && <p>{outcome}</p>}
            {lastRollDice1 !== null && lastRollDice2 !== null && (
                <p>
                {lastRollDice1.toString()},{lastRollDice2.toString()}
                </p>
            )}                
            </div>
            
            <button onClick={() => refetch()}>Get Rolls</button>
            <p>2x Estimated Gas: {((estimatedGas ?? BigInt(100000)) * BigInt(2)).toString()}</p>     
            <div>All Rolls: {JSON.stringify(allRolls, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )}</div>
            <div>Roll Outcome: {JSON.stringify(outcome, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )}</div>
            <div>Dice1: {lastRollDice1}</div>
            <div>Dice2: {lastRollDice2}</div>
            
            
        </div>
    )
}