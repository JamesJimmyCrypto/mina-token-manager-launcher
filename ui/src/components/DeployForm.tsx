import React, { useState, useEffect } from 'react';
import ContractWorkerClient from '../pages/contractWorkerClient';
import { v4 as uuidv4 } from 'uuid'; 


export default function DeployForm() {
  const [tokenSymbol, setTokenSymbol] = useState('ABC');
  const [decimals, setDecimals] = useState('9');
  const [sourceUrl, setSourceUrl] = useState("https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts");
  const [adminWallet, setAdminWallet] = useState<string | null>(null);
  const [feePayerKey, setFeePayerKey] = useState<string>('');
  const [workerClient, setWorkerClient] = useState<ContractWorkerClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<{
    contractAddress: string;
    adminAddress: string;
    adminPrivateKey: string;
    transactionHash: string;
  } | null>(null);

  const [network, setNetwork] = useState<string>('Devnet');

  useEffect(() => {  
    const storedNetwork = typeof window !== 'undefined' ? localStorage.getItem('network') : null;
    if (storedNetwork) {
      setNetwork(storedNetwork);
    }
  }, []);

  useEffect(() => {
    const initializeWorker = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setDisplayText('🔧 Initializing contract worker...');
        const client = new ContractWorkerClient();     
       
       await client.setActiveInstance(network);     
        await client.loadContract();
        await client.compileContract();
        setWorkerClient(client);
        setDisplayText('✅ Contract worker initialized successfully');
        await checkAuroWallet();
      } catch (err) {
        console.error("Failed to initialize worker:", err);
        setError("Failed to initialize. Please try again.");
        setDisplayText('❌ Failed to initialize contract worker');
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorker();
  }, [network]);

  const checkAuroWallet = async () => {
    const mina = (window as any).mina;
    if (mina) {
      try {
        setDisplayText('🔗 Connecting to Auro Wallet...');
        const accounts = await mina.getAccounts();
        if (accounts.length > 0) {
          setAdminWallet(accounts[0]);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminWallet || !workerClient) {
      alert('Please connect your Auro Wallet first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setDisplayText('🚀 Preparing deployment...');
      const deployResult = await workerClient.deployToken(
        feePayerKey,
        tokenSymbol,
        parseInt(decimals),
        sourceUrl,
        network
      );

      setDisplayText('📄 Getting transaction JSON...');
      const transactionJSON = await workerClient.getTransactionJSON();

      setDisplayText('📡 Sending transaction via Auro Wallet...');
      const sendResult = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: 0.1,
          memo: ''
        }
      });

      // Ensure all values are defined before setting the state
      if (deployResult.contractAddress && deployResult.adminAddress && deployResult.adminPrivateKey && sendResult.hash) {
        setDeploymentResult({
          contractAddress: deployResult.contractAddress,
          adminAddress: deployResult.adminAddress,
          adminPrivateKey: deployResult.adminPrivateKey,
          transactionHash: sendResult.hash
        });
      } else {
        throw new Error('Deployment result is incomplete');
      }

      // Add new token information to localStorage
      const newToken = {
        id: uuidv4(), // Generate a unique ID
        address: deployResult.contractAddress,
        adminPublicKey: deployResult.adminAddress,
        adminPrivateKey: deployResult.adminPrivateKey,
        status: 'Launched'
      };

      const existingTokens = JSON.parse(localStorage.getItem('tokens') || '[]');
      localStorage.setItem('tokens', JSON.stringify([...existingTokens, newToken]));

      setDisplayText('🎉 Token deployed successfully');
    } catch (error) {
      console.error('Deployment failed:', error);
      setError('Deployment failed. Please try again.');
      setDisplayText('❌ Deployment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const handleNetworkChange = (newNetwork: string) => {
    setNetwork(newNetwork);
    if (typeof window !== 'undefined') {
      localStorage.setItem('network', newNetwork);
    }
  };

  if (isLoading) {
    return <div>Loading... {displayText}</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-red-500 border-l-4 border-red-700 p-4 rounded-md text-white">
        <p className="font-bold">Warning:</p>
        <p className="mt-2">This page is for testing and development purposes only. It is not secure for real funds. We recommend using the official repository: <a href="https://github.com/MinaFoundation/mina-fungible-token/tree/main" className="underline hover:text-red-200">Mina Fungible Token</a>.</p>
        <p className="mt-2">Due to limitations of O1js and Auro wallet, we need to take private keys as input for transactions requiring multiple signatures.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="tokenSymbol" className="block text-sm font-medium text-gray-300 mb-1">Token Symbol</label>
          <input 
            type="text" 
            id="tokenSymbol" 
            name="tokenSymbol" 
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="decimals" className="block text-sm font-medium text-gray-300 mb-1">Decimals</label>
          <input 
            type="number" 
            id="decimals" 
            name="decimals" 
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-300 mb-1">Source URL</label>
          <input 
            type="text" 
            id="sourceUrl" 
            name="sourceUrl" 
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="feePayerKey" className="block text-sm font-medium text-gray-300 mb-1">Fee Payer Private Key</label>
          <input 
            type="text" 
            id="feePayerKey" 
            name="feePayerKey" 
            value={feePayerKey}
            onChange={(e) => setFeePayerKey(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Admin Wallet</label>
          <input 
            type="text" 
            value={adminWallet || 'Connect your Auro Wallet'}
            readOnly
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="network" className="block text-sm font-medium text-gray-300 mb-1">Network</label>
          <select
            id="network"
            value={network}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Devnet">Devnet</option>
            <option value="Mainnet">Mainnet</option>
          </select>
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-150 ease-in-out"
          disabled={isLoading || !adminWallet}
        >
          {isLoading ? 'Deploying...' : 'Deploy'}
        </button>
      </form>
      
      {displayText && (
        <div className="mt-4 p-3 bg-gray-800 rounded-md">
          <p className="text-sm text-gray-300">Status: {displayText}</p>
        </div>
      )}
      
      {deploymentResult && (
        <>
          <div className="mt-6 p-4 bg-yellow-900 border border-yellow-700 text-yellow-100 rounded-md mb-4">
            <strong className="text-yellow-200">Important:</strong> Please save the following information securely. You will need the Admin Contract details for future operations such as Mint, Burn, and Pause. Without these details, you won't be able to perform administrative actions on your token.
          </div>
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-md">
            <h3 className="text-lg font-semibold mb-2 text-blue-300">Deployment Result</h3>
            <p className="text-sm text-gray-400 mb-3">Please save these details securely:</p>
            <div className="space-y-3">
              {Object.entries(deploymentResult).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-300 w-40">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <div className="flex-1 mt-1 sm:mt-0">
                    <input 
                      type="text" 
                      readOnly 
                      value={value} 
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
                    />
                  </div>
                  <button 
                    onClick={() => copyToClipboard(value)}
                    className="mt-2 sm:mt-0 sm:ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 ease-in-out"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}