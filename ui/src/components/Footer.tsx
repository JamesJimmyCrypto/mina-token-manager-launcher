import React from 'react';
import { FaGithub } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <a 
          href="https://github.com/izzetemredemir/mina-token-manager" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center hover:text-gray-300 transition duration-150 ease-in-out"
        >
          <FaGithub className="mr-2 text-xl" />
          <span>GitHub Repository</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;