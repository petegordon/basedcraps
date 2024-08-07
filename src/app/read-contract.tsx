import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract} from 'wagmi'
import { parseEther } from 'viem'

const contractABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "player", "type": "address" }, { "indexed": false, "internalType": "uint8", "name": "value1", "type": "uint8" }, { "indexed": false, "internalType": "uint8", "name": "value2", "type": "uint8" }, { "indexed": false, "internalType": "string", "name": "outcome", "type": "string" }], "name": "DiceRolled", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "playerAddress", "type": "address" }], "name": "getRollsForAddress", "outputs": [{ "components": [{ "components": [{ "internalType": "uint8", "name": "value1", "type": "uint8" }, { "internalType": "uint8", "name": "value2", "type": "uint8" }], "internalType": "struct DiceRoller.Roll[]", "name": "rolls", "type": "tuple[]" }, { "internalType": "uint8", "name": "point", "type": "uint8" }, { "internalType": "string", "name": "outcome", "type": "string" }], "internalType": "struct DiceRoller.PlayerData", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "playerData", "outputs": [{ "internalType": "uint8", "name": "point", "type": "uint8" }, { "internalType": "string", "name": "outcome", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "rollDice", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

export function ReadContract(config: any) {
    console.log('config: ', config)
    console.log('ReadContract ... ')
    console.log(config.config.chains)
    const [outcome, setOutcome] = useState<object | string | null>(null);
    const { writeContract } = useWriteContract()
    const { data, refetch } = useReadContract({
        abi: contractABI,
        address: '0x492eCDB67522b428336f1bB6bbdEB68DE8Fa8aa9',
        functionName: 'getRollsForAddress',
        args: ['0x232006Df7CC1838d6ba3193d09eE591aEf1C7f5E'],
      });    

    useEffect(() => {
    if (data) {
        setOutcome(data);
    }
    }, [data]);
        
    return (
        <div>
        <button 
        onClick={() => writeContract({
            abi: contractABI,
            address: '0x492eCDB67522b428336f1bB6bbdEB68DE8Fa8aa9',
            functionName: 'rollDice',
            value: parseEther('0.0003')
        })  
    }>Roll Dice</button>
     <button onClick={() => refetch()}>Get Rolls</button>
     <div>Test getRollsForAddress: {JSON.stringify(outcome)}</div> 
    </div>
    )
}