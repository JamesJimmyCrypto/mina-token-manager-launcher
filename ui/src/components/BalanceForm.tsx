import React, { useState, useEffect } from 'react';
import ContractWorkerClient from '../pages/contractWorkerClient';
import { PublicKey } from 'o1js';
import styles from '../styles/BalanceForm.module.css'; 

interface BalanceFormProps {
  contractWorkerClient: ContractWorkerClient | null;
  isContractReady: boolean;
  tokenAddress: string;
}

export default function BalanceForm({ contractWorkerClient, isContractReady, tokenAddress }: BalanceFormProps) {
    const [publicKeyBase58, setPublicKeyBase58] = useState('');
    const [balance, setBalance] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [displayText, setDisplayText] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        checkAuroWallet();
    }, []);

    const checkAuroWallet = async () => {
        const mina = (window as any).mina;
        if (mina) {
            try {
                setDisplayText('Connecting to Auro Wallet...');
                const accounts = await mina.getAccounts();
                if (accounts.length > 0) {
                    setPublicKeyBase58(accounts[0]);
                    setWalletAddress(accounts[0]);
                    setDisplayText('Auro Wallet connected successfully');
                } else {
                    setDisplayText('No accounts found in Auro Wallet');
                }
            } catch (error) {
                console.error("Failed to get Auro Wallet accounts:", error);
                setDisplayText('Failed to connect to Auro Wallet');
            }
        } else {
            setDisplayText('Auro Wallet not detected');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBalance(null);
        setError(null);
        setLoading(true);
        setDisplayText('Fetching balance...');

        if (!isContractReady || !contractWorkerClient) {
            setError('Contract is not ready. Please wait and try again.');
            setLoading(false);
            setDisplayText('Error: Contract not ready');
            return;
        }

        try {
            setDisplayText('Fetching account details...');
            const publicKey = PublicKey.fromBase58(publicKeyBase58);
            await contractWorkerClient.fetchAccount({ publicKey });

            await contractWorkerClient.fetchTokenAccount(PublicKey.fromBase58(tokenAddress));
            await contractWorkerClient.fetchTokenAccount(PublicKey.fromBase58(publicKeyBase58));

            setDisplayText('Getting balance...');
            const balance = await contractWorkerClient.getBalance(publicKeyBase58);
            setBalance(balance.toString());
            setDisplayText('Balance fetched successfully');
        } catch (error) {
            console.error('An error occurred while fetching balance:', error);
            setError('An error occurred while fetching balance.');
            setDisplayText('Error fetching balance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-300 mb-2">Token Address</label>
                <input
                    type="text"
                    id="tokenAddress"
                    value={tokenAddress}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
            </div>
            <div>
                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-300 mb-2">Wallet Public Key</label>
                <input
                    type="text"
                    id="publicKey"
                    value={publicKeyBase58}
                    onChange={(e) => setPublicKeyBase58(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    placeholder="Enter wallet public key"
                />
            </div>
            <button 
                type="submit" 
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                disabled={loading || !isContractReady}
            >
                {loading ? (
                    <div className="flex items-center justify-center">
                        <div className={`${styles.animateSpin} rounded-full h-5 w-5 border-b-2 border-white`}></div>
                        <span className="ml-2">Checking...</span>
                    </div>
                ) : 'Check Balance'}
            </button>
            {loading && (
                <div className="flex justify-center mt-4">
                    <div className={`${styles.animateSpin} rounded-full h-8 w-8 border-b-2 border-blue-500`}></div>
                </div>
            )}
            {balance && <p className="mt-4 text-green-400">Balance: {balance}</p>}
            {error && <p className="mt-4 text-red-400">{error}</p>}
            {displayText && (
                <div className="mt-4 text-sm text-gray-400">
                    Status: {displayText}
                </div>
            )}
            {!isContractReady && <p className="text-yellow-400">Initializing contract worker...</p>}
            {walletAddress ? (
                <p className="text-green-400">Wallet connected: {walletAddress}</p>
            ) : (
                <p className="text-yellow-400">Wallet not connected</p>
            )}
        </form>
    );
}