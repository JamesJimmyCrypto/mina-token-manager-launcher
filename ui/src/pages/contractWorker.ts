import {
  Mina,
  PublicKey,
  fetchAccount,
  Field,
  UInt64,
  AccountUpdate,
  PrivateKey,
  UInt8,
  Bool,
} from "o1js";
import type { FungibleToken } from "../../../contracts/build/src/FungibleToken.js";
import type { FungibleTokenAdmin } from "../../../contracts/build/src/FungibleTokenAdmin.js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const NETWORK_URLS: any = {
  Devnet: "https://proxy.devnet.minaexplorer.com/graphql",
  Mainnet: "https://api.minascan.io/archive/mainnet/v1/graphql",
};

async function getInferredNonce(publicKey: string, network: string = "Devnet") {
  const url = NETWORK_URLS[network] || NETWORK_URLS.Devnet;

  const query = `
  query {
    account(publicKey: "${publicKey}") {
      inferredNonce
    }
  }`;

  const json = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ operationName: null, query, variables: {} }),
    headers: { "Content-Type": "application/json" },
  }).then((v) => v.json());
  return Number(json.data.account.inferredNonce);
}

// ---------------------------------------------------------------------------------------

const state = {
  FungibleToken: null as null | typeof FungibleToken,
  FungibleTokenAdmin: null as null | typeof FungibleTokenAdmin,
  zkapp: null as null | FungibleToken,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstance: async (
    networkObj: { network: string } | string = "Devnet"
  ) => {
    let network: string;
    if (typeof networkObj === "object" && networkObj.network) {
      network = networkObj.network;
    } else if (typeof networkObj === "string") {
      network = networkObj;
    } else {
      throw new Error("Invalid network parameter");
    }

    console.log("setActiveInstance is running", network);
    let graphqlUrl;
    if (network === "Devnet") {
      graphqlUrl = "https://proxy.devnet.minaexplorer.com/graphql";
    } else if (network === "Mainnet") {
      graphqlUrl = "https://api.minascan.io/archive/mainnet/v1/graphql";
    } else {
      throw new Error("Invalid network");
    }

    const Network = Mina.Network(graphqlUrl);
    Mina.setActiveInstance(Network);
  },
  loadContract: async (args: {}) => {
    const { FungibleToken } = await import(
      "../../../contracts/build/src/FungibleToken.js"
    );
    const { FungibleTokenAdmin } = await import(
      "../../../contracts/build/src/FungibleTokenAdmin.js"
    );
    state.FungibleToken = FungibleToken;
    state.FungibleTokenAdmin = FungibleTokenAdmin;
  },
  compileContract: async (args: {}) => {
    console.log("compileContract is running for FungibleToken");

    await state.FungibleToken!.compile();
    console.log("compileContract is running for FungibleTokenAdmin");

    await state.FungibleTokenAdmin!.compile();
  },
  fetchAccountfunc: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  fetchTokenAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    // @ts-ignore
    let tokenId: Field = await state.zkapp!.deriveTokenId();
    let response: any = await fetchAccount({
      publicKey: publicKey,
      tokenId: tokenId,
    });
    return response;
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.FungibleToken!(publicKey);
  },
  getBalance: async (args: { address58: string }) => {
    const address = PublicKey.fromBase58(args.address58);
    const balance = await state.zkapp!.getBalanceOf(address);
    return balance.toString();
  },

  getDecimals: async (args: {}) => {
    const decimals = await state.zkapp!.getDecimals();
    return decimals.toString();
  },
  getCirculating: async (args: {}) => {
    const circulating = await state.zkapp!.getCirculating();
    return circulating.toString();
  },
  createTransferTransaction: async (args: {
    from58: string;
    to58: string;
    amount: string;
  }) => {
    const from = PublicKey.fromBase58(args.from58);
    const to = PublicKey.fromBase58(args.to58);
    const amount = UInt64.from(args.amount); // Use UInt64 instead of Field
    const transaction = await Mina.transaction(async () => {
      await state.zkapp!.transfer(from, to, amount);
    });
    state.transaction = transaction;
  },
  proveTransaction: async (args: {}) => {
    let prove = await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  getAdminContract: async () => {
    try {
      // Call the getAdminContract method without returning anything
      let adminContract = await state.zkapp!.getAdminContract();
      return adminContract.address.toBase58();
      // No return statement needed
    } catch (error) {
      console.error("Error while getting admin contract:", error);
      // No need to throw the error, just log it
    }
  },
  deriveTokenId: async (args: {}) => {
    if (!state.zkapp) {
      console.error("zkapp instance not initialized for deriveTokenId");
      return "Error: zkapp instance not initialized";
    }
    try {
      // @ts-ignore
      const tokenId = await state.zkapp.deriveTokenId();
      return tokenId.toString();
    } catch (error) {
      console.error("Error occurred while deriving Token ID:", error);
      return "Error: Token ID could not be derived";
    }
  },
  mintToken: async (args: {
    sender: string;
    recipientAddress58: string;
    amount: string;
    adminPrivateKey58: string;
    feePayerPrivateKey58: string;
  }) => {
    try {
      const recipientAddress = PublicKey.fromBase58(args.recipientAddress58);
      const amount = UInt64.from(args.amount);
      const adminPrivateKey = PrivateKey.fromBase58(args.adminPrivateKey58); // Convert admin private key
      const feePayerPrivateKey = PrivateKey.fromBase58(
        args.feePayerPrivateKey58
      ); // Convert fee payer private key

      let feePayerPublicKey = feePayerPrivateKey.toPublicKey();
      const transaction = await Mina.transaction(
        { sender: PublicKey.fromJSON(args.sender) },
        async () => {
          AccountUpdate.fundNewAccount(feePayerPublicKey, 1);
          await state.zkapp!.mint(recipientAddress, amount);
        }
      );

      await transaction.prove();

      // Sign the transaction with both admin and fee payer private keys
      transaction.sign([adminPrivateKey, feePayerPrivateKey]);

      state.transaction = transaction;

      return "Mint operation created successfully";
    } catch (error) {
      console.error("Error occurred during mint operation:", error);
      return "Error: Mint operation could not be performed";
    }
  },

  deployToken: async (args: {
    feePayerKey58: string;
    tokenSymbol: string;
    tokenDecimals: number;
    src?: string;
    network: string;
  }) => {
    const feePayerKey = PrivateKey.fromBase58(args.feePayerKey58);
    const feePayer = {
      privateKey: feePayerKey,
      publicKey: feePayerKey.toPublicKey(),
    };
    let randomAdminKey: PrivateKey = PrivateKey.random();
    const admin = {
      publicKey: randomAdminKey.toPublicKey(),
      privateKey: randomAdminKey,
    };

    let randomKey: PrivateKey = PrivateKey.random();
    const contract = {
      publicKey: randomKey.toPublicKey(),
      privateKey: randomKey,
    };

    try {
      console.log(
        "Deploying token",
        args.tokenSymbol,
        args.tokenDecimals,
        args.src
      );

      const network = args.network || "Devnet";
      const nonce = await getInferredNonce(
        feePayer.publicKey.toBase58(),
        network
      );

      console.log("Nonce:", nonce);
      // @ts-ignore
      const token = new state.FungibleToken!(contract.publicKey);
      // @ts-ignore
      const adminContract = new state.FungibleTokenAdmin!(admin.publicKey);

      const deployTx = await Mina.transaction(
        {
          sender: feePayer.publicKey,
          nonce: nonce,
          fee: 1e8,
        },
        async () => {
          AccountUpdate.fundNewAccount(feePayer.publicKey, 3);
          await adminContract.deploy({ adminPublicKey: admin.publicKey });
          await token.deploy({
            symbol: args.tokenSymbol,
            src:
              args.src ||
              "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
          });
          await token.initialize(
            admin.publicKey,
            UInt8.from(args.tokenDecimals),
            Bool(false)
          );
        }
      );

      console.log("Deploy transaction created");

      await deployTx.prove();
      deployTx.sign([
        feePayer.privateKey,
        contract.privateKey,
        admin.privateKey,
      ]);

      //const deployTxResult = await deployTx.send().then((v:any) => v.wait());

      //console.log("Deploy transaction result:", deployTxResult);

      state.transaction = deployTx;

      return {
        contractAddress: contract.publicKey.toBase58(),
        adminAddress: admin.publicKey.toBase58(),
        adminPrivateKey: admin.privateKey.toBase58(),
      };
    } catch (error) {
      console.error("Deployment failed:", error);
      throw error;
    }
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== "undefined") {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log("FungibleToken Worker successfully started.");
