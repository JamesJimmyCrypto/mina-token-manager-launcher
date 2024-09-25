'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import DeployForm from '../components/DeployForm';
import Footer from '../components/Footer';

const DeployPage: React.FC = () => {
  const [network, setNetwork] = useState(''); // Add state for network

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header network={network} setNetwork={setNetwork} />
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex-grow">
        <h1 className="text-4xl font-extrabold mb-8 text-center">Deploy Token</h1>
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8">
          <DeployForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeployPage;