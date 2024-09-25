'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import MintForm from '../components/MintForm';
import TransferForm from '../components/TransferForm';
import BalanceForm from '../components/BalanceForm';
import Footer from '../components/Footer';
import ContractWorkerClient from './contractWorkerClient';
import { Token } from '../types/Token'; // Adjust the import path as needed
import { PublicKey } from 'o1js';

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}
interface TokenDetails {
  name: string;
  symbol: string;
  address: string;
  circulating: string;
  decimals: string;
  adminContract: string;
  tokenId: string;
}



export default function TokenPage() {
  const [network, setNetwork] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedNetwork = localStorage.getItem('network');
      return storedNetwork ? storedNetwork.charAt(0).toUpperCase() + storedNetwork.slice(1).toLowerCase() : 'Devnet';
    }
    return 'Devnet';
  });

  const [token, setToken] = useState<TokenDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'mint' | 'transfer' | 'balance'>('info');
  const router = useRouter();
  const { address } = router.query;
  const [copied, setCopied] = useState(false);
  const [contractWorkerClient, setContractWorkerClient] = useState<ContractWorkerClient | null>(null);
  const [isContractReady, setIsContractReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [adminPrivateKey, setAdminPrivateKey] = useState<string | null>(null);

  const connectWallet = async () => {

    try {
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const { address } = router.query;
    if (address && typeof address === 'string' && typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('tokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        const foundToken = tokens.find((t: Token) => t.address === address);
        if (foundToken) {
          setToken({
            name: foundToken.name || 'Unknown',
            symbol: foundToken.symbol || 'UNKNOWN',
            address: foundToken.address,
            circulating: foundToken.circulating || 'N/A',
            decimals: foundToken.decimals || 'N/A',
            adminContract: foundToken.adminContract || 'N/A',
            tokenId: foundToken.tokenId || 'N/A'
          });
        } else {
          console.log('Token not found in local storage');
        }
      }
    }
  }, [router.query]);

  useEffect(() => {
    const setupContractWorker = async () => {
      try {
        setLoadingMessage("Setting up contract worker...");
        const client = new ContractWorkerClient();
        
        setLoadingMessage("Setting active instance to selected network...");
        await client.setActiveInstance(network);
        
        setLoadingMessage("Loading contract...");
        await client.loadContract();
        
        setLoadingMessage("Compiling contract...");
        await client.compileContract();
        
        if (address && typeof address === 'string') {
          setLoadingMessage("Initializing zkApp instance...");
          await client.initZkappInstance(address);
          
          setLoadingMessage("Fetching account...");
          const publicKey = PublicKey.fromBase58(address);
          await client.fetchAccount({ publicKey });
          await client.fetchTokenAccount(publicKey);
          
          setLoadingMessage("Fetching token details...");
          const circulating = await client.getCirculating();
          const decimals = await client.getDecimals();
          let adminContract:any = 'N/A';
          try {
            adminContract = await client.getAdminContract();
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.error("Error fetching admin contract:", error.message);
            } else {
              console.error("Unknown error fetching admin contract");
            }
          }
          const tokenId = await client.deriveTokenId();

          setToken(prevToken => ({
            ...prevToken!,
            circulating,
            decimals,
            adminContract,
            tokenId
          }));
        }
        
        setContractWorkerClient(client);
        setIsContractReady(true);
        setLoadingMessage("Setup complete!");
        setIsLoading(false);
      } catch (error) {
        console.error("Error setting up contract worker:", error);
        if (error instanceof Error) {
          setLoadingMessage(`Error: ${error.message}`);
        } else {
          setLoadingMessage("An unknown error occurred");
        }
      }
    };

    if (address) {
      setupContractWorker();
    }
  }, [address]);

  useEffect(() => {
    const fetchAdminPrivateKey = async () => {
      if (token?.address && typeof window !== 'undefined') {
        const storedTokens = localStorage.getItem('tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          const currentToken = tokens.find((t: any) => t.address === token.address);
          if (currentToken && currentToken.adminPrivateKey) {
            setAdminPrivateKey(currentToken.adminPrivateKey);
          } else {
            setAdminPrivateKey(null);
          }
        }
      }
    };

    if (token) {
      fetchAdminPrivateKey();
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('network', network);
    }
  }, [network]);

  const handleNetworkChange = (newNetwork: string) => {
    setNetwork(newNetwork);
    if (typeof window !== 'undefined') {
      localStorage.setItem('network', newNetwork);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center">
        <div className="text-2xl mb-4">Loading Token Details</div>
        <div className="text-lg mb-8">{loadingMessage}</div>
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) return <div>Token not found</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header network={network} setNetwork={handleNetworkChange} />
      
      <main className="flex-grow max-w-4xl mx-auto py-8 px-4">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Token Address</h1>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="text-gray-400 hover:text-white">•••</button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="bg-gray-700 rounded-md p-2 shadow-lg">
                <DropdownMenu.Item 
                  className="text-white hover:bg-gray-600 rounded px-2 py-1 cursor-pointer" 
                  onClick={() => window.open(`https://minascan.io/${network.toLowerCase()}/account/${token.address}?type=zk-acc`, '_blank')}
                >
                  MinaScan
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
          <div className="flex items-center">
            <p className="text-xl text-white mr-2 truncate flex-grow">
              {typeof address === 'string' ? address : 'Unknown Address'}
            </p>
            <button
              onClick={() => copyToClipboard(address as string)}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded text-sm whitespace-nowrap"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="flex border-b border-gray-700">
            {['info', 'mint', 'transfer', 'balance'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } transition duration-150 ease-in-out`}
                onClick={() => setActiveTab(tab as 'info' | 'mint' | 'transfer' | 'balance')}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'info' && token && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Circulating" value={token.circulating} />
                <InfoItem label="Decimals" value={token.decimals} />
                <InfoItem 
                  label="Admin Contract" 
                  value={token.adminContract} 
                  copyable
                />
                <InfoItem 
                  label="Token ID" 
                  value={token.tokenId} 
                  copyable
                />
              </div>
            )}
       {activeTab === 'mint' && (
            adminPrivateKey ? (
              <MintForm 
                contractWorkerClient={contractWorkerClient} 
                isContractReady={isContractReady}
                setAdminPrivateKey={setAdminPrivateKey}
                tokenAddress={token.address}
                adminPrivateKey={adminPrivateKey}
                connectWallet={connectWallet}
                network={network} // Add this line
              />
            ) : (
              <div className="text-yellow-500 p-4 bg-yellow-100 rounded-md">
                Admin private key not found. Please go to the My Tokens page to set it up.
              </div>
            )
          )}
            {activeTab === 'transfer' && (
              <TransferForm 
                contractWorkerClient={contractWorkerClient} 
                isContractReady={isContractReady}
                tokenAddress={token.address}
                network={network}
                
              />
            )}
            {activeTab === 'balance' && (
              <BalanceForm 
                contractWorkerClient={contractWorkerClient} 
                isContractReady={isContractReady}
                tokenAddress={token.address}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string | number;
  copyable?: boolean;
}

const InfoItem = ({ label, value, copyable = false }: InfoItemProps) => (
  <div className="bg-gray-700 rounded-lg p-4">
    <p className="text-gray-400 mb-2">{label}:</p>
    <div className="flex items-center">
      <p className="text-xl text-white mr-2 truncate flex-grow">{value}</p>
      {copyable && (
        <button
          onClick={() => copyToClipboard(String(value))}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded text-sm whitespace-nowrap"
        >
          Copy
        </button>
      )}
    </div>
  </div>
);

