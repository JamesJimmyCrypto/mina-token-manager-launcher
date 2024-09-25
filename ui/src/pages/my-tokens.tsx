import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../components/Footer';

interface Token {
  id: string;
  address: string;
  adminPublicKey?: string;
  adminPrivateKey?: string;
  status: 'Launched' | 'Pending';
}

export default function MyTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [network, setNetwork] = useState('Devnet');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [adminPublicKey, setAdminPublicKey] = useState('');
  const [adminPrivateKey, setAdminPrivateKey] = useState('');

  useEffect(() => {
    const storedTokens = localStorage.getItem('tokens');
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }, [tokens]);

  const handleImportToken = () => {
    const newToken: Token = {
      id: Date.now().toString(),
      address: tokenAddress,
      adminPublicKey: adminPublicKey || undefined,
      adminPrivateKey: adminPrivateKey || undefined,
      status: 'Launched',
    };

    setTokens([...tokens, newToken]);
    localStorage.setItem('tokens', JSON.stringify([...tokens, newToken]));
    setIsImportModalOpen(false);
    setTokenAddress('');
    setAdminPublicKey('');
    setAdminPrivateKey('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${label} copied to clipboard!`);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast.error('Failed to copy to clipboard');
      }
    );
  };

  const removeToken = (id: string) => {
    if (window.confirm('Are you sure you want to remove this token?')) {
      const updatedTokens = tokens.filter(token => token.id !== id);
      setTokens(updatedTokens);
      localStorage.setItem('tokens', JSON.stringify(updatedTokens));
      toast.info('Token removed successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header network={network} setNetwork={setNetwork} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your deployed tokens</h1>
          <div className="space-x-4">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-full border border-white text-white hover:bg-white hover:text-gray-900 transition-colors"
            >
              Import a token
            </button>
            <Link href="/deploy" className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              Deploy a token
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          {tokens.length === 0 ? (
            <p>No tokens found. Import or deploy your first token to get started!</p>
          ) : (
            tokens.map((token) => (
              <div key={token.id} className="mb-6 p-4 bg-gray-700 rounded-lg">
                {/* Show Token Information */}
                <div className="flex justify-between items-center mb-2">
                  <Link href={`/token?address=${token.address}`}>
                    <span className="text-xl font-semibold">{token.address}</span>
                  </Link>
                  <span className={`px-2 py-1 rounded ${token.status === 'Launched' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {token.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Token Address:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{token.address}</span>
                      <button onClick={() => copyToClipboard(token.address, 'Token Address')} className="text-indigo-400 hover:text-indigo-300">
                        Copy
                      </button>
                    </div>
                  </div>
                  {token.adminPublicKey && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Admin Public Key:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{token.adminPublicKey}</span>
                        <button onClick={() => copyToClipboard(token.adminPublicKey!, 'Admin Public Key')} className="text-indigo-400 hover:text-indigo-300">
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  {token.adminPrivateKey && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Admin Private Key:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">••••••••</span>
                        <button onClick={() => copyToClipboard(token.adminPrivateKey!, 'Admin Private Key')} className="text-indigo-400 hover:text-indigo-300">
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <button 
                    onClick={() => removeToken(token.id)} 
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                  <Link 
                    href={`/token?address=${token.address}`}
                    className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Import token</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-400">
                  Token Contract Address (required)
                </label>
                <input
                  type="text"
                  id="tokenAddress"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="adminPublicKey" className="block text-sm font-medium text-gray-400">
                  Admin Contract Public Key (optional)
                </label>
                <input
                  type="text"
                  id="adminPublicKey"
                  value={adminPublicKey}
                  onChange={(e) => setAdminPublicKey(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>
              <div>
                <label htmlFor="adminPrivateKey" className="block text-sm font-medium text-gray-400">
                  Admin Contract Private Key (optional)
                </label>
                <input
                  type="password"
                  id="adminPrivateKey"
                  value={adminPrivateKey}
                  onChange={(e) => setAdminPrivateKey(e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>
              <button
                onClick={handleImportToken}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

// B62qq4Eb1fYLxcJeZJRNyMJb9dYSdyAvTJf5yLZUQfuLx6Bcmf5CoGY