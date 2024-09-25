import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface HeaderProps {
  network: string;
  setNetwork: (network: string) => void;
}

export default function Header({ network, setNetwork }: HeaderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkWalletConnection();
    // Load network from localStorage on component mount
    const storedNetwork = localStorage.getItem('network');
    if (storedNetwork) {
      setNetwork(storedNetwork);
    }
  }, []);

  const checkWalletConnection = async () => {
    const mina = (window as any).mina;
    if (mina) {
      try {
        const accounts = await mina.getAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Failed to get accounts:", error);
      }
    }
  };

  const connectWallet = async () => {
    const mina = (window as any).mina;
    if (mina) {
      try {
        const accounts = await mina.requestAccounts();
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Auro Wallet is not installed!");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const handleNetworkChange = (newNetwork: string) => {
    setNetwork(newNetwork);
    localStorage.setItem('network', newNetwork);
  };

  return (
    <>
      <Head>
        <title>Mina Token Manager - Deploy, Mint, and Manage Tokens on Mina Protocol</title>
        <meta name="description" content="Create, deploy, and manage fungible tokens on the Mina Protocol. Easily mint new tokens, transfer between accounts, check balances, and perform administrative actions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="Mina Protocol, Fungible Tokens, Blockchain, Cryptocurrency, Token Management" />
        <meta property="og:title" content="Mina Token Manager" />
        <meta property="og:description" content="Deploy, mint, and manage fungible tokens on the Mina Protocol with ease." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://minatokenmanager.com/" />
        <meta property="og:image" content="https://minatokenmanager.com/mina-token-manager.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mina Token Manager" />
        <meta name="twitter:description" content="Deploy, mint, and manage fungible tokens on the Mina Protocol with ease." />
        <meta name="twitter:image" content="https://minatokenmanager.com/mina-token-manager.png" />
        <link rel="canonical" href="https://minatokenmanager.com/" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white mr-8 hover:text-blue-400 transition duration-150">
                Mina Token Manager
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link href="/" className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${router.pathname === '/' ? 'bg-gray-800' : ''}`}>
                  Home
                </Link>
                <Link href="/my-tokens" className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${router.pathname === '/my-tokens' ? 'bg-gray-800' : ''}`}>
                  My Tokens
                </Link>
                <Link href="/deploy" className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${router.pathname === '/deploy' ? 'bg-gray-800' : ''}`}>
                  Deploy
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={network}
                onChange={(e) => handleNetworkChange(e.target.value)}
                className="bg-gray-800 text-white py-2 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              >
                <option value="Devnet">Devnet</option>
                <option value="Mainnet">Mainnet</option>
              </select>
              {walletAddress ? (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white py-2 px-4 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}