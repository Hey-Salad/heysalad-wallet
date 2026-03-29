// Type declarations for elliptic
declare module 'elliptic' {
  export class ec {
    constructor(curve: string);
    keyFromPrivate(key: string, encoding: string): KeyPair;
    keyFromPublic(key: string, encoding: string): KeyPair;
  }

  export interface KeyPair {
    getPrivate(encoding?: string): any;
    getPublic(compact?: boolean, encoding?: string): any;
    sign(msg: string, options?: { canonical?: boolean }): Signature;
    verify(msg: string, signature: any): boolean;
  }

  export interface Signature {
    r: any;
    s: any;
    recoveryParam: number | null;
  }
}
