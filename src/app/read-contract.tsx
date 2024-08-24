import React from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useEstimateGas, useReadContract, useWriteContract, useWatchContractEvent} from 'wagmi'
import { parseEther } from 'viem'
import Overlay from './Overlay'; // Import the Overlay component
import './read-contract.css'; // You'll create this CSS file to style the overlay
import { DiceRollClaude } from './dice-roll-claude';
import DiceRollOutcome from './DiceRollOutcome';
import OutcomeOverlay from './OutcomeOverlay';

const contractABI = [{"inputs":[{"internalType":"address","name":"_admin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"AdminWithdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint8","name":"value1","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"value2","type":"uint8"},{"indexed":false,"internalType":"string","name":"outcome","type":"string"}],"name":"DiceRolled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"FundsAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"depositFunds","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"playerAddress","type":"address"}],"name":"getRollsForAddress","outputs":[{"components":[{"components":[{"internalType":"uint8","name":"value1","type":"uint8"},{"internalType":"uint8","name":"value2","type":"uint8"}],"internalType":"struct DiceRoller.Roll[]","name":"rolls","type":"tuple[]"},{"internalType":"uint8","name":"point","type":"uint8"},{"internalType":"string","name":"outcome","type":"string"},{"internalType":"uint256","name":"balance","type":"uint256"}],"internalType":"struct DiceRoller.PlayerData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerData","outputs":[{"internalType":"uint8","name":"point","type":"uint8"},{"internalType":"string","name":"outcome","type":"string"},{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rollDice","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}]

export function ReadContract({ config }: { config: any}) {
    //console.log('config: ', config)
    //console.log('ReadContract ... ')
    //console.log(config.config.chains)
    const { address } = useAccount()
    const [outcome, setOutcome] = useState<string | null>(null);
    const [lastRollDice1, setLastRollDice1] = useState<number | null>(null);
    const [lastRollDice2, setLastRollDice2] = useState<number | null>(null);
    const [allRolls, setAllRolls] = useState<object | string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [emoji, setEmoji] = useState<string>(''); // Store the emoji to display
    const [showOverlay, setShowOverlay] = useState<boolean>(false);

    const [tempOutcome, setTempOutcome] = useState<string | null>(null);
    const [tempLastRollDice1, setTempLastRollDice1] = useState<number | null>(null);
    const [tempLastRollDice2, setTempLastRollDice2] = useState<number | null>(null);

    const { writeContractAsync } = useWriteContract()
    const { data, refetch } = useReadContract({
        abi: contractABI,
        address: '0x34654f752D2A64d47Ea97F6eBD9D1699B625cE84',
        functionName: 'getRollsForAddress',
        args: [address],
      }); 

    useEffect(() => {
        if (data) {
            setAllRolls(data);
        }
    }, [data]);

    useEffect(() => {
        if (outcome) {
          let outcomeEmoji = '';
          switch (outcome) {
            case 'WIN':
              outcomeEmoji = '🎉💰';
              break;
            case 'LOSE':
              outcomeEmoji = '☠❌☠';
              break;
            case 'ROLL':
              outcomeEmoji = '⚄⚀...'; // Choose the most relevant emoji for 'ROLL'
              break;
            default:
              outcomeEmoji = '';
          }
          setShowOverlay(true); // Show the overlay
          setEmoji(outcomeEmoji);
        }
      }, [outcome]);

    const handleOverlayClose = () => {
        setShowOverlay(false);
    };

    useEffect(() => {
        if (countdown === 0) {
            // Update the state with the delayed values after countdown finishes
            console.log('set outcome:', tempOutcome)
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
        address: '0x34654f752D2A64d47Ea97F6eBD9D1699B625cE84',
        eventName: 'DiceRolled',
        onError(error) {
            console.error('Error listening for events', error);
        },
        onLogs(logs) {
            const diceRolledLogs = logs as unknown as Array<{ args: DiceRolledEvent }>;
            console.log('DiceRolled logs:', diceRolledLogs);
            setOutcome(diceRolledLogs[0].args.outcome);
            setLastRollDice1(diceRolledLogs[0].args.value1);
            setLastRollDice2(diceRolledLogs[0].args.value2);            
        },
    });       

    

    const { data: estimatedGas, refetch: estimateGas } = useEstimateGas({
        data: '0x837e7cc6',       
        to: '0x34654f752D2A64d47Ea97F6eBD9D1699B625cE84',
        value: parseEther('0.0003'), // If your function requires sending ETH
      });

    const handleRollDice = async () => {
        try {

            // Trigger the contract call immediately
            await writeContractAsync({
                abi: contractABI,
                address: '0x34654f752D2A64d47Ea97F6eBD9D1699B625cE84',
                functionName: 'rollDice',
                value: parseEther('0.0003'),
                gas: (estimatedGas ?? BigInt(100000)) * BigInt(2),                       
            });
            //console.log('set countdown')
            //setCountdown(3); // Start countdown    
        } catch (error) {
            console.error('Transaction failed:', error);
            // Handle any errors here
        }
    };
    
    return (
        <div>
            {/*

            <Overlay countdown={countdown} />
            {showOverlay && <OutcomeOverlay outcome={outcome} emoji={emoji} onClose={handleOverlayClose} />}
            <hr></hr>
            <br></br>

            */}
            <div className="button-container">
            <button className="roll-dice-button"
                onClick={handleRollDice}
                disabled={countdown !== null} // Disable button while countdown is active
            >   
                {outcome === null && <div>Start Rolling!</div>}             
                {outcome === 'WIN' && <div><div>You Won!</div><div className="emoji-button">{emoji}</div><div>Play Again</div></div>}
                {outcome === 'LOSE' && <div><div>You Lose!</div><div className="emoji-button">{emoji}</div><div>Try Again</div></div>}
                {outcome === 'ROLL' && <div><div>Roll Again!</div><div className="emoji-button">{emoji}</div><div>Keep going</div></div>}
            </button>            
            </div>
            {/*

            <div>
                <p>outcome div</p>
                {outcome === 'WIN' && <div><div>Test WIN{outcome}</div><DiceRollOutcome outcome={outcome} emoji={['🎉', '💰']} count={10} /></div>}
                {outcome === 'LOSE' && <div><div>Test LOSE {outcome}</div><DiceRollOutcome outcome={outcome} emoji={['☠️', '❌']} count={10} /></div>}
                {outcome === 'ROLL' && <div><div>Test ROLL {outcome}</div><DiceRollOutcome outcome={outcome} emoji={['⚅', '⚄', '⚃', '⚂', '⚁', '⚀', '✅']} count={10} /></div>}
            </div>

            */}
            <DiceRollClaude dice1={lastRollDice1} dice2={lastRollDice2} />            
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