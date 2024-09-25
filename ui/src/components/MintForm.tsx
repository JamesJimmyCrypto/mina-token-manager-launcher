declare const window: any;

import React, { useState, useEffect } from 'react';
import ContractWorkerClient from '../pages/contractWorkerClient';
import { PublicKey } from 'o1js';
import styles from '../styles/BalanceForm.module.css'; 
import Link from 'next/link';

interface MintFormProps {
  contractWorkerClient: ContractWorkerClient | null;
  isContractReady: boolean;
  tokenAddress: string;
  adminPrivateKey: string | null;
  setAdminPrivateKey: (value: string | null) => void;
  connectWallet: () => Promise<void>;
  network: any; 
}

export default function MintForm({ contractWorkerClient, isContractReady, tokenAddress, adminPrivateKey, setAdminPrivateKey, connectWallet,network }: MintFormProps) {
  const [amount, setAmount] = useState('99');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const [adminPublicKey, setAdminPublicKey] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [feePayerPrivateKey, setFeePayerPrivateKey] = useState<string | null>(null);
  const [isAdminKeyAvailable, setIsAdminKeyAvailable] = useState(false);
  const [transactionLink, setTransactionLink] = useState<string | null>(null);

  useEffect(() => {
    if (adminPrivateKey) {
      setIsAdminKeyAvailable(true);
    } else {
      setIsAdminKeyAvailable(false);
    }
  }, [adminPrivateKey]);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.mina) {
        try {
          const accounts = await window.mina.getAccounts();
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setRecipientPublicKey(accounts[0]); // Set the public key of the connected wallet
          }
        } catch (error) {
          console.error("Failed to get Auro Wallet accounts:", error);
        }
      }
    };

    checkWalletConnection();
    
    // Listen for wallet connection changes
    window.mina?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setRecipientPublicKey(accounts[0]); // Update public key when wallet changes
      } else {
        setWalletAddress(null);
        setRecipientPublicKey(''); // Clear public key when wallet disconnects
      }
    });

    return () => {
      // Cleanup
      window.mina?.removeAllListeners("accountsChanged");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMintResult(null);
    setLoading(true);
    setDisplayText(null);

    console.log("Admin private key:", adminPrivateKey);
    console.log("Contract worker client state:", contractWorkerClient);
    console.log("Admin public key:", adminPublicKey);
    console.log("Wallet address:", walletAddress);

    if (!isContractReady || !contractWorkerClient) {
      setError('Contract is not ready. Please wait and try again.');
      setLoading(false);
      return;
    }

    if (!walletAddress) {
      setError('Auro Wallet is not connected. Please connect your wallet and try again.');
      setLoading(false);
      return;
    }

    try {
      const publicKey = PublicKey.fromBase58(walletAddress);

      setDisplayText('🔍 Fetching accounts and token information...');
      await contractWorkerClient!.fetchAccount({
        publicKey: publicKey
      });

      await contractWorkerClient!.fetchAccount({
        publicKey: PublicKey.fromBase58(tokenAddress)
      });

      await contractWorkerClient.fetchTokenAccount(PublicKey.fromBase58(tokenAddress));
      await contractWorkerClient.fetchTokenAccount(publicKey);

      setDisplayText('💰 Minting tokens...');
      console.log("Minting token...");

      console.log("recipientPublicKey", recipientPublicKey);
  
      await contractWorkerClient!.mintToken(
        walletAddress,
     recipientPublicKey,
        amount,
        adminPrivateKey!,
        feePayerPrivateKey!
      );

      //setDisplayText('Creating proof...');
      //console.log('Creating proof...');
      // await state.contractWorkerClient!.proveTransaction();
  
      setDisplayText('🚀 Requesting send transaction...');
      console.log('Requesting send transaction...');
      const transactionJSON = await contractWorkerClient!.getTransactionJSON();

  
      setDisplayText('📊 Getting transaction JSON...');
      console.log('Getting transaction JSON...');
      console.log("transactionJSON", transactionJSON);
      const result = await (window as any).mina.sendTransaction({   
        transaction: transactionJSON,
        feePayer: {
          fee: 0.1,
          memo: ''
        }
      });

      console.log('Transaction sent:', result);
      setDisplayText('✅ Transaction sent successfully!');

      const transactionHash = result.hash || result.transactionHash || JSON.stringify(result);

      const minascanLink = `https://minascan.io/${network.toLowerCase()}/tx/${transactionHash}/txInfo`;
      console.log(`View transaction on Minascan: ${minascanLink}`);
      setTransactionLink(minascanLink);

    } catch (error) {
      console.error("Minting error:", error);
      setError(`An error occurred while minting tokens: ${error instanceof Error ? error.message : String(error)}`);
      setDisplayText('❌ Minting failed. Please check the error message.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      const accounts = await window.mina?.requestAccounts();
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setError("Failed to connect wallet. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
      <div className="p-4 border-l-4 border-red-500 bg-red-900 text-red-200 mb-6 rounded-r-md">
        <strong>Warning:</strong> This page is for testing and development purposes only. It is not secure for real funds. We recommend using the official repository: <a href="https://github.com/MinaFoundation/mina-fungible-token/tree/main" className="underline text-blue-300 hover:text-blue-200">Mina Fungible Token</a>.
        <br />
        Due to limitations of O1js and Auro wallet, we need to take private keys as input for transactions requiring multiple signatures.
      </div>
      {!isAdminKeyAvailable && (
        <div className="p-4 border-l-4 border-yellow-500 bg-yellow-900 text-yellow-200 mb-6 rounded-r-md">
          Admin private key not found. Please go to the <Link href="/my-tokens" className="underline text-blue-300 hover:text-blue-200">My Tokens page</Link> to set it up.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Enter amount to mint"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm">$TOKEN</span>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="recipientPublicKey" className="block text-sm font-medium text-gray-300 mb-2">Recipient Public Key</label>
          <input 
            type="text" 
            id="recipientPublicKey" 
            value={recipientPublicKey}
            onChange={(e) => setRecipientPublicKey(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            placeholder="Enter recipient's public key"
            readOnly={!!walletAddress} // Make input read-only if wallet is connected
          />
        </div>
        {isAdminKeyAvailable && (
          <div>
            <label htmlFor="adminPrivateKey" className="block text-sm font-medium text-gray-300 mb-2">Admin Contract Private Key</label>
            <input 
              type="password" 
              id="adminPrivateKey" 
              value={adminPrivateKey || ''}
              className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              placeholder="Enter admin contract private key"
              readOnly
            />
          </div>
        )}
        <div>
          <label htmlFor="feePayerPrivateKey" className="block text-sm font-medium text-gray-300 mb-2">Fee Payer Private Key</label>
          <input 
            type="password" 
            id="feePayerPrivateKey" 
            value={feePayerPrivateKey || ''}
            onChange={(e) => setFeePayerPrivateKey(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            placeholder="Enter fee payer private key"
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !isContractReady}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className={`${styles.animateSpin} rounded-full h-5 w-5 border-b-2 border-white`}></div>
              <span className="ml-2">Minting...</span>
            </div>
          ) : 'Mint Tokens'}
        </button>
        {mintResult && <p className="mt-4 text-green-400 bg-green-900 p-3 rounded-md">{mintResult}</p>}
        {error && <p className="mt-4 text-red-400 bg-red-900 p-3 rounded-md">{error}</p>}
        {displayText && (
          <div className="mt-4 text-sm text-gray-400 bg-gray-700 p-3 rounded-md">
            Status: {displayText}
          </div>
        )}
        {!isContractReady && <p className="mt-4 text-yellow-500 bg-yellow-900 p-3 rounded-md">Initializing contract worker...</p>}
        {!walletAddress && <p className="mt-4 text-yellow-500 bg-yellow-900 p-3 rounded-md">Wallet not connected</p>}
        {walletAddress ? (
          <p className="text-green-400">Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            Connect Wallet
          </button>
        )}
        {transactionLink && (
          <div className="mt-4">
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
    </div>
  );
}