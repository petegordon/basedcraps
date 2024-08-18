import { useState, useEffect } from 'react';
import { useAccount, useEstimateGas, useReadContract, useWriteContract} from 'wagmi'
import { parseEther } from 'viem'
import { estimateGas } from '@wagmi/core'

const contractABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "player", "type": "address" }, { "indexed": false, "internalType": "uint8", "name": "value1", "type": "uint8" }, { "indexed": false, "internalType": "uint8", "name": "value2", "type": "uint8" }, { "indexed": false, "internalType": "string", "name": "outcome", "type": "string" }], "name": "DiceRolled", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "playerAddress", "type": "address" }], "name": "getRollsForAddress", "outputs": [{ "components": [{ "components": [{ "internalType": "uint8", "name": "value1", "type": "uint8" }, { "internalType": "uint8", "name": "value2", "type": "uint8" }], "internalType": "struct DiceRoller.Roll[]", "name": "rolls", "type": "tuple[]" }, { "internalType": "uint8", "name": "point", "type": "uint8" }, { "internalType": "string", "name": "outcome", "type": "string" }], "internalType": "struct DiceRoller.PlayerData", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "playerData", "outputs": [{ "internalType": "uint8", "name": "point", "type": "uint8" }, { "internalType": "string", "name": "outcome", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "rollDice", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

export function GasEstimate(config: any) {


    console.log(config)
    const { data: estimatedGas, refetch: estimateGas } = useEstimateGas({
        data: '0x837e7cc6',       
        to: '0x61E96a002c40e29c68bD679dA7f48Aaea3F317a0',
        value: parseEther('0.0003'), // If your function requires sending ETH
      });
    
      return (
        <div>
          <button onClick={() => { estimateGas() }}>Estimate Gas</button>
          {estimatedGas && <p>Estimated Gas: {estimatedGas.toString()}</p>}
        </div>
      );
}