import { PublicKey, Field, UInt64 } from 'o1js';

import type {
  ZkappWorkerReponse,
  ZkappWorkerRequest,
  WorkerFunctions,
} from './contractWorker';

export default class ContractWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstance(network: string = 'Devnet') {
    return this._call('setActiveInstance', { network });
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): Promise<any> {
    return this._call('fetchAccountfunc', {
      publicKey58: publicKey.toBase58()
    });
  }

  fetchTokenAccount(publicKey: PublicKey): Promise<any> {
    return this._call('fetchTokenAccount', {
      publicKey58: publicKey.toBase58()
    });
  }

  initZkappInstance(publicKey: string) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey,
    });
  }

  getBalance(address: string): Promise<any> {
    return this._call('getBalance', {
      address58: address
    })
  }

  getDecimals(): Promise<any> {
    return this._call('getDecimals', {});
  }

  getCirculating(): Promise<any> {
    return this._call('getCirculating', {});
  }

  createTransferTransaction(from: string, to: string, amount: string) {
    return this._call('createTransferTransaction', {
      from58: from,
      to58: to,
      amount: amount,
    });
  }

  proveTransaction() {
    return this._call('proveTransaction', {});
  }

  getTransactionJSON() {
    return this._call('getTransactionJSON', {});
  }

  getAdminContract() {
    return this._call('getAdminContract', {});
  }

  deriveTokenId(): Promise<any> {
    return this._call('deriveTokenId', {});
  }

  mintToken(sender: string, recipientAddress: string, amount: string, adminPrivateKey58: string, feePayerPrivateKey58: string): Promise<any> {
    return this._call('mintToken', {
      sender: sender,
      recipientAddress58: recipientAddress,
      amount: amount,
      adminPrivateKey58: adminPrivateKey58,
      feePayerPrivateKey58: feePayerPrivateKey58,
    });
  }

  deployToken(
    feePayerKey58: string,
    tokenSymbol: string,
    tokenDecimals: number,
    src?: string,
    network: string = 'Devnet'  // Varsayılan değer olarak 'Devnet' ekledik
  ): Promise<{
    contractAddress: string;
    adminAddress: string;
    adminPrivateKey: string;
  }> {
    return this._call('deployToken', {
      feePayerKey58,
      tokenSymbol,
      tokenDecimals,
      src,
      network,  // network parametresini ekledik
    });
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./contractWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call<T>(fn: WorkerFunctions, args: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}