import Head from 'next/head';
import { useState } from 'react';
import Header from '../components/Header';
import Link from 'next/link';
import Footer from '../components/Footer';

export default function Home() {
  const [network, setNetwork] = useState('Devnet');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header network={network} setNetwork={setNetwork} />

      <main className="container mx-auto px-4 py-16 text-center flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center items-center mb-8">
            <img src="/mina-logo.webp" alt="Mina Logo" className="h-16 w-16 rounded-full object-cover mr-4" />
            <h1 className="text-6xl font-bold">Mina Token Manager</h1>
          </div>
          <p className="text-2xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            Deploy, Mint, Transfer, and Manage Tokens on Mina
          </p>
          <p className="text-xl mb-12">
            Welcome to the Mina Fungible Token Manager. This tool allows you to create, deploy, and manage 
            fungible tokens on the Mina Protocol. Easily mint new tokens, transfer between accounts, 
            check balances, and perform administrative actions - all leveraging Mina's powerful 
            zero-knowledge technology.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/deploy" className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-purple-700 transition duration-300">
              Deploy Token
            </Link>
            <Link href="/my-tokens" className="bg-transparent border border-white text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white hover:text-black transition duration-300">
              Manage Tokens
            </Link>
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-gray-800 rounded-lg p-4">
                <summary className="text-lg font-medium cursor-pointer">What is Mina Fungible Token?</summary>
                <p className="mt-2 text-gray-300">Mina Fungible Token is a standard implementation of fungible tokens on the Mina Protocol, following RFC14: Fungible Token Standard on Mina.</p>
              </details>

              <details className="bg-gray-800 rounded-lg p-4">
              <summary className="text-lg font-medium cursor-pointer">Is this implementation production-ready?</summary>
              <p className="mt-2 text-gray-300">No, this implementation is for development and testing purposes only. It is not intended for use with real funds or in a production environment.</p>
            </details>

            <details className="bg-gray-800 rounded-lg p-4">
              <summary className="text-lg font-medium cursor-pointer">Why are Admin Contract and FeePayer Private keys required?</summary>
              <p className="mt-2 text-gray-300">Due to limitations of O1js and Auro wallet, we need to take private keys as input for transactions requiring multiple signatures. This is not secure for real funds and should only be used for testing and development purposes. We recommend using the official <a href="https://github.com/MinaFoundation/mina-fungible-token/tree/main" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Mina Fungible Token repository</a> for production use.</p>
          </details>

              <details className="bg-gray-800 rounded-lg p-4">
                <summary className="text-lg font-medium cursor-pointer">How can I use Mina Fungible Token in my project?</summary>
                <p className="mt-2 text-gray-300">You can integrate Mina Fungible Token into your project by installing it via npm. For detailed usage instructions, please refer to the official documentation.</p>
              </details>

              <details className="bg-gray-800 rounded-lg p-4">
                <summary className="text-lg font-medium cursor-pointer">Where can I find more information?</summary>
                <p className="mt-2 text-gray-300">For more detailed information, examples, and API documentation, visit the <a href="https://github.com/MinaFoundation/mina-fungible-token" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">official Mina Fungible Token GitHub repository</a>.</p>
              </details>

              <details className="bg-gray-800 rounded-lg p-4">
                <summary className="text-lg font-medium cursor-pointer">Why does it take so long for pages to load?</summary>
                <p className="mt-2 text-gray-300">Unlike other blockchains, Mina zkApps require compilation and proof generation on the client side, i.e., in the browser. This process is unique to Mina's zero-knowledge technology and can take some time. The compilation and proof generation are necessary to ensure the privacy and security features that make Mina special. While this may result in longer loading times, it's a trade-off for the enhanced security and privacy that Mina provides.</p>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

