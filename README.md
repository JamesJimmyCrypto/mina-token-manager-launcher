# Mina Token Manager

Mina Token Manager is a web application built with Next.js and TypeScript that allows users to deploy, mint, transfer, and manage fungible tokens on the Mina Protocol. This tool leverages Mina's powerful zero-knowledge technology to provide a user-friendly interface for token management.

## Features

- Deploy new fungible tokens on the Mina Protocol
- Mint tokens to specified addresses
- Transfer tokens between accounts
- Check token balances
- Manage multiple tokens
- Support for both Devnet and Mainnet

## Warning

This application is for testing and development purposes only. It is not secure for use with real funds. We recommend using the official [Mina Fungible Token repository](https://github.com/MinaFoundation/mina-fungible-token/tree/main) for production use.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Auro Wallet browser extension

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/izzetemredemir/mina-token-manager.git
   cd mina-token-manager
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `pages/`: Contains the main pages of the application (index, deploy, token, my-tokens)
- `components/`: Reusable React components (Header, Footer, DeployForm, MintForm, TransferForm, etc.)
- `styles/`: Global styles and CSS modules
- `public/`: Static assets

## Key Components

- `DeployForm`: Handles the deployment of new tokens
- `MintForm`: Allows minting of tokens to specified addresses
- `TransferForm`: Facilitates token transfers between accounts
- `BalanceForm`: Checks token balances for given addresses

## Network Support

The application supports both Devnet and Mainnet. Users can switch between networks using the network selector in the header.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to our [GitHub repository](https://github.com/izzetemredemir/mina-token-manager).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This project is not affiliated with or endorsed by O(1) Labs or the Mina Foundation. Use at your own risk.

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Mina Protocol Documentation](https://docs.minaprotocol.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Live Demo

You can try out the Mina Token Manager at [https://minatokenmanager.com/](https://minatokenmanager.com/)
