import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/trpc";

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

export type IOURequest = {
  id: string;
  from: string;
  to: string;
  amountTrx: number;
  note?: string;
  createdAt: number;
  settled: boolean;
};

export type WalletState = {
  address: string; // base58 address
  tronBalance: number;
  tokenBalance: number;
  transactions: Transaction[];
  iouRequests: IOURequest[];
};

const STORAGE_KEY = "heysalad_wallet_v1";

const defaultWallet: WalletState = {
  address: "",
  tronBalance: 0,
  tokenBalance: 0,
  transactions: [],
  iouRequests: [],
};

async function loadWallet(): Promise<WalletState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const envAddr = process.env.EXPO_PUBLIC_TRON_ADDRESS ?? "";
    if (envAddr) {
      const seeded: WalletState = { ...defaultWallet, address: envAddr };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return defaultWallet;
  }
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

  const tronGetAccount = trpc.tron.getAccount.useQuery(
    { address: wallet.address },
    { enabled: !!wallet.address, staleTime: 15_000 }
  );
  const tronGetTxs = trpc.tron.getTransactions.useQuery(
    { address: wallet.address, limit: 25 },
    { enabled: !!wallet.address, staleTime: 15_000 }
  );


  useEffect(() => {
    if (walletQuery.data) setWallet(walletQuery.data);
  }, [walletQuery.data]);

  useEffect(() => {
    if (tronGetAccount.data && typeof tronGetAccount.data === "object") {
      const anyData: any = tronGetAccount.data as any;
      const acct = anyData.data?.[0] ?? anyData.data ?? anyData;
      const balanceSun = typeof acct?.balance === "number" ? acct.balance : 0;
      const tronBalance = balanceSun / 1_000_000;
      setWallet((s) => ({ ...s, tronBalance }));
    }
  }, [tronGetAccount.data]);

  useEffect(() => {
    if (tronGetTxs.data) {
      const anyData: any = tronGetTxs.data as any;
      const arr: any[] = Array.isArray(anyData.data) ? anyData.data : [];
      const list = arr.map((t: any, idx: number) => {
        const amountSun = t?.raw_data?.contract?.[0]?.parameter?.value?.amount ?? 0;
        const to = t?.raw_data?.contract?.[0]?.parameter?.value?.to_address ?? "";
        const amountTrx = amountSun / 1_000_000;
        const tx: Transaction = {
          id: t?.txID ?? String(idx),
          to,
          amountTrx,
          fiatAmount: amountTrx * 0.12,
          note: "",
          category: "other",
          timestamp: (t?.block_timestamp as number) ?? Date.now(),
          sustainable: false,
        };
        return tx;
      });
      setWallet((s) => ({ ...s, transactions: list }));
    }
  }, [tronGetTxs.data]);

  const persistMutation = useMutation({
    mutationFn: persistWallet,
    onSuccess: (data) => {
      queryClient.setQueryData(["wallet"], data);
    },
  });

  const send = useCallback(
    (to: string, amountTrx: number, note?: string, category: TxCategory = "other", sustainable = false, participants?: { name: string; share: number }[]) => {
      console.log("[Wallet] send local record", { to, amountTrx, note, category, sustainable, participants });
      if (amountTrx <= 0) throw new Error("Amount must be greater than zero");

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

      setWallet((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
      // balances are source-of-truth from chain; trigger refetch
      tronGetAccount.refetch?.();
      tronGetTxs?.refetch?.();
      return tx;
    },
    [tronGetAccount, tronGetTxs]
  );

  const receiveMock = useCallback((from: string, amountTrx: number, note?: string, category: TxCategory = "other") => {
    console.log("[Wallet] receiveMock disabled in live mode", { from, amountTrx, note, category });
    return null as unknown as Transaction;
  }, []);

  const addIOU = useCallback((to: string, amountTrx: number, note?: string) => {
    if (amountTrx <= 0) throw new Error("Amount must be greater than zero");
    const iou: IOURequest = {
      id: `${Date.now()}`,
      from: wallet.address || "me",
      to,
      amountTrx,
      note,
      createdAt: Date.now(),
      settled: false,
    };
    setWallet((s) => ({ ...s, iouRequests: [iou, ...s.iouRequests] }));
    persistMutation.mutate({ ...wallet, iouRequests: [iou, ...wallet.iouRequests] });
    return iou;
  }, [wallet, persistMutation]);

  const settleIOU = useCallback((id: string) => {
    setWallet((s) => {
      const updated = s.iouRequests.map((i) => (i.id === id ? { ...i, settled: true } : i));
      const next = { ...s, iouRequests: updated };
      persistMutation.mutate(next);
      return next;
    });
  }, [persistMutation]);

  const value = useMemo(() => {
    return {
      wallet,
      isLoading: walletQuery.isLoading || persistMutation.isPending || tronGetAccount.isLoading,
      send,
      addIOU,
      settleIOU,
      receiveMock,
      setAddress: (addr: string) => {
        const updated: WalletState = { ...wallet, address: addr };
        setWallet(updated);
        persistMutation.mutate(updated);
      },
    };
  }, [wallet, walletQuery.isLoading, persistMutation.isPending, tronGetAccount.isLoading, send, addIOU, settleIOU, receiveMock, persistMutation]);

  return value;
});

export type WalletContextValue = ReturnType<typeof useWallet>;