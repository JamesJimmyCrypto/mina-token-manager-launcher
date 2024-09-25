import React, { useState, useEffect } from 'react';
import { PublicKey, UInt64 } from 'o1js';
import ContractWorkerClient from '../pages/contractWorkerClient';

interface TransferFormProps {
  contractWorkerClient: ContractWorkerClient | null;
  isContractReady: boolean;
  tokenAddress: string;
  network: string; // Add this line
}

export default function TransferForm({ contractWorkerClient, isContractReady, tokenAddress, network }: TransferFormProps) {
  const [senderWallet, setSenderWallet] = useState<string | null>(null);
  const [receiverWallet, setReceiverWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [transactionLink, setTransactionLink] = useState<string | null>(null);

  useEffect(() => {
    checkAuroWallet();
  }, []);

  const checkAuroWallet = async () => {
    const mina = (window as any).mina;
    if (mina) {
      try {
        setDisplayText('🔄 Connecting to Auro Wallet...');
        const accounts = await mina.getAccounts();
        if (accounts.length > 0) {
          setSenderWallet(accounts[0]);
          setDisplayText('✅ Auro Wallet connected successfully');
        }
      } catch (error) {
        console.error("Failed to get Auro Wallet accounts:", error);
        setError("Failed to connect to Auro Wallet. Please make sure it's installed and unlocked.");
        setDisplayText('❌ Failed to connect to Auro Wallet');
      }
    } else {
      setError("Auro Wallet not detected. Please install Auro Wallet extension.");
      setDisplayText('⚠️ Auro Wallet not detected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDisplayText(null);

    try {
      if (!contractWorkerClient) {
        throw new Error('Contract worker client is not initialized');
      }

      if (!senderWallet) {
        throw new Error('Sender wallet is not connected');
      }

      setDisplayText('📝 Creating transfer transaction...');
      await contractWorkerClient.createTransferTransaction(
        senderWallet,
        receiverWallet,  
        amount
      );

      setDisplayText('🔍 Proving transaction...');
      await contractWorkerClient.proveTransaction();

      setDisplayText('✅ Transaction created and proved successfully. Ready to send.');

      console.log('Requesting send transaction...');
      setDisplayText('🚀 Requesting send transaction...');
      const transactionJSON = await contractWorkerClient!.getTransactionJSON();

      setDisplayText('📊 Getting transaction JSON...');
      console.log('Getting transaction JSON...');
      console.log("transactionJSON", transactionJSON);
      const tx = await (window as any).mina.sendTransaction({   
        transaction: transactionJSON,
        feePayer: {
          fee: 0.1,
          memo: ''
        }
      });

      let hash:any = tx.hash;
      console.log('Transaction sent:', hash);
      setDisplayText('🚀 Transaction sent');

      console.log(`Got pending transaction with hash ${hash}`);
      const minascanLink = `https://minascan.io/${network.toLowerCase()}/tx/${hash}/txInfo`;
      console.log(`View transaction on Minascan: ${minascanLink}`);
      setTransactionLink(minascanLink);

    } catch (error) {
      console.error('Transfer failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setDisplayText('❌ Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Token Address</label>
        <input 
          type="text" 
          value={tokenAddress}
          readOnly
          className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="senderWallet" className="block text-sm font-medium text-gray-300 mb-2">Sender Wallet</label>
        <input 
          type="text" 
          id="senderWallet" 
          value={senderWallet || 'Connect your Auro Wallet'}
          readOnly
          className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="receiverWallet" className="block text-sm font-medium text-gray-300 mb-2">Receiver Wallet</label>
        <input 
          type="text" 
          id="receiverWallet" 
          value={receiverWallet}
          onChange={(e) => setReceiverWallet(e.target.value)}
          className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
          placeholder="Enter receiver's wallet address"
        />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
        <div className="relative rounded-md shadow-sm">
          <input 
            type="number" 
            id="amount" 
            name="amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-md bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">$TOKEN</span>
          </div>
        </div>
      </div>
      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !senderWallet || !isContractReady}
      >
        {isLoading ? 'Processing...' : 'Transfer'}
      </button>
      {!isContractReady && <p className="text-yellow-500 text-center mt-2">Initializing contract worker...</p>}
      {displayText && (
        <div className="mt-4 text-sm text-gray-400 bg-gray-700 p-3 rounded-md">
          Status: {displayText}
        </div>
      )} 
      {error && (
        <div className="mt-4 text-sm text-red-400 bg-red-900 p-3 rounded-md">
          Error: {error}
        </div>
      )}
      {transactionLink && (
        <div>
          <p className="text-green-400">Transaction sent successfully!</p>
          <a 
            href={transactionLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block truncate max-w-full text-blue-400 hover:text-blue-300"
            title={transactionLink}
          >
            View transaction on Minascan: {transactionLink}
          </a>
        </div>
      )}
    </form>
  );
}