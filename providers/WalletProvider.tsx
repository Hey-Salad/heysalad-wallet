import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TxCategory = "groceries" | "restaurants" | "farmers_market" | "delivery" | "other" | "sustainable";

export type Transaction = {
  id: string;
  to: string;
  amountTrx: number;
  fiatAmount: number;
  note?: string;
  category: TxCategory;
  timestamp: number;
  sustainable: boolean;
  participants?: { name: string; share: number }[];
};

export type WalletState = {
  address: string;
  tronBalance: number;
  tokenBalance: number;
  transactions: Transaction[];
};

const STORAGE_KEY = "heysalad_wallet_v1";

const defaultWallet: WalletState = {
  address: "THeYsaLadMockAddR355x9yZ",
  tronBalance: 1234.56,
  tokenBalance: 420,
  transactions: [],
};

async function loadWallet(): Promise<WalletState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultWallet;
  try {
    const parsed = JSON.parse(raw) as WalletState;
    return parsed;
  } catch (e) {
    console.error("[Wallet] Failed to parse wallet, resetting", e);
    return defaultWallet;
  }
}

async function persistWallet(state: WalletState): Promise<WalletState> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export const [WalletProvider, useWallet] = createContextHook(() => {
  const queryClient = useQueryClient();
  const walletQuery = useQuery({ queryKey: ["wallet"], queryFn: loadWallet });

  const [wallet, setWallet] = useState<WalletState>(walletQuery.data ?? defaultWallet);

  useEffect(() => {
    if (walletQuery.data) setWallet(walletQuery.data);
  }, [walletQuery.data]);

  const persistMutation = useMutation({
    mutationFn: persistWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["wallet"], data);
    },
  });

  const send = useCallback(
    (to: string, amountTrx: number, note?: string, category: TxCategory = "other", sustainable = false, participants?: { name: string; share: number }[]) => {
      console.log("[Wallet] send", { to, amountTrx, note, category, sustainable, participants });
      if (amountTrx <= 0) throw new Error("Amount must be greater than zero");
      if (wallet.tronBalance < amountTrx) throw new Error("Insufficient TRX balance");

      const fiatAmount = amountTrx * 0.12;
      const tx: Transaction = {
        id: `${Date.now()}`,
        to,
        amountTrx,
        fiatAmount,
        note,
        category,
        timestamp: Date.now(),
        sustainable,
        participants,
      };

      const updated: WalletState = {
        ...wallet,
        tronBalance: wallet.tronBalance - amountTrx,
        tokenBalance: wallet.tokenBalance + (sustainable ? Math.ceil(fiatAmount * 0.1) : 0),
        transactions: [tx, ...wallet.transactions],
      };
      setWallet(updated);
      persistMutation.mutate(updated);
      return tx;
    },
    [wallet, persistMutation.mutate]
  );

  const receiveMock = useCallback((from: string, amountTrx: number, note?: string, category: TxCategory = "other") => {
    console.log("[Wallet] receiveMock", { from, amountTrx, note, category });
    const fiatAmount = amountTrx * 0.12;
    const tx: Transaction = {
      id: `${Date.now()}`,
      to: wallet.address,
      amountTrx,
      fiatAmount,
      note,
      category,
      timestamp: Date.now(),
      sustainable: false,
    };
    const updated: WalletState = {
      ...wallet,
      tronBalance: wallet.tronBalance + amountTrx,
      transactions: [tx, ...wallet.transactions],
    };
    setWallet(updated);
    persistMutation.mutate(updated);
    return tx;
  }, [wallet, persistMutation.mutate]);

  const value = useMemo(() => {
    return {
      wallet,
      isLoading: walletQuery.isLoading || persistMutation.isPending,
      send,
      receiveMock,
    };
  }, [wallet, walletQuery.isLoading, persistMutation.isPending, send, receiveMock]);

  return value;
});

export type WalletContextValue = ReturnType<typeof useWallet>;