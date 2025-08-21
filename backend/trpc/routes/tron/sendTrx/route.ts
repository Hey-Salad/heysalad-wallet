import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const schema = z.object({
  to: z.string().min(1),
  amountSun: z.number().int().positive(),
  nodeUrl: z.string().url().optional(),
  from: z.string().min(1).optional(),
});

export default publicProcedure
  .input(schema)
  .mutation(async ({ input }) => {
    const base = input.nodeUrl ?? process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://nile.trongrid.io";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.EXPO_PUBLIC_TRONGRID_API_KEY) {
      headers["TRON-PRO-API-KEY"] = process.env.EXPO_PUBLIC_TRONGRID_API_KEY;
    }

    const rawPk = (process.env.TRON_PRIVATE_KEY ?? process.env.PRIVATE_KEY ?? "").trim();
    if (!rawPk) {
      console.error("[tron.sendTrx] Missing TRON_PRIVATE_KEY on server");
      throw new Error("Server misconfigured: missing TRON private key");
    }
    const serverPrivateKey = rawPk.startsWith("0x") ? rawPk.slice(2) : rawPk;
    const isHex64 = /^[0-9a-fA-F]{64}$/.test(serverPrivateKey);
    if (!isHex64) {
      console.error("[tron.sendTrx] Invalid TRON_PRIVATE_KEY format. Expect 64-hex characters.");
      throw new Error("Invalid server private key format");
    }

    const owner = input.from ?? process.env.TRON_OWNER_ADDRESS ?? process.env.EXPO_PUBLIC_TRON_ADDRESS ?? "";
    if (!owner) {
      console.error("[tron.sendTrx] Missing owner address");
      throw new Error("Missing owner address. Provide input.from or set TRON_OWNER_ADDRESS");
    }

    const createBody = {
      to_address: input.to,
      owner_address: owner,
      amount: input.amountSun,
      visible: true,
    };

    const triggerRes = await fetch(`${base}/wallet/createtransaction`, {
      method: "POST",
      headers,
      body: JSON.stringify(createBody),
    });

    const triggerText = await triggerRes.text();
    if (!triggerRes.ok) {
      console.error("[tron.sendTrx] createtransaction HTTP", triggerRes.status, triggerText);
      throw new Error(`Failed to create transaction (${triggerRes.status})`);
    }

    let tx: any;
    try {
      tx = JSON.parse(triggerText);
    } catch (e) {
      console.error("[tron.sendTrx] createtransaction JSON parse fail", e, triggerText);
      throw new Error("Invalid createtransaction response");
    }

    if (tx?.Error || !tx?.raw_data) {
      console.error("[tron.sendTrx] createtransaction logical error", tx);
      const msg = typeof tx?.Error === "string" ? tx.Error : "Create transaction error";
      throw new Error(msg);
    }

    const signRes = await fetch(`${base}/wallet/gettransactionsign`, {
      method: "POST",
      headers,
      body: JSON.stringify({ transaction: tx, privateKey: serverPrivateKey }),
    });

    const signText = await signRes.text();
    if (!signRes.ok) {
      console.error("[tron.sendTrx] sign HTTP", signRes.status, signText);
      throw new Error("Failed to sign transaction");
    }

    let signed: any;
    try {
      signed = JSON.parse(signText);
    } catch (e) {
      console.error("[tron.sendTrx] sign JSON parse fail", e, signText);
      throw new Error("Invalid sign response");
    }

    if (!signed?.signature) {
      console.error("[tron.sendTrx] sign logical error", signed);
      throw new Error("Signing failed: missing signature");
    }

    const bcast = await fetch(`${base}/wallet/broadcasttransaction`, {
      method: "POST",
      headers,
      body: JSON.stringify(signed),
    });

    const bcastText = await bcast.text();
    if (!bcast.ok) {
      console.error("[tron.sendTrx] broadcast HTTP", bcast.status, bcastText);
      throw new Error("Failed to broadcast transaction");
    }

    let result: any;
    try {
      result = JSON.parse(bcastText);
    } catch (e) {
      console.error("[tron.sendTrx] broadcast JSON parse fail", e, bcastText);
      throw new Error("Invalid broadcast response");
    }

    const txid: string | undefined = result?.txid ?? signed?.txID ?? signed?.txId;
    const networkBase = (base.includes("nile") ? "https://nile.tronscan.org/#/transaction/" : "https://tronscan.org/#/transaction/");
    return { ...result, txid, explorerUrl: txid ? `${networkBase}${txid}` : undefined } as unknown;
  });