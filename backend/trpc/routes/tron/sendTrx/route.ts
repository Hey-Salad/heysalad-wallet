// backend/trpc/routes/tron/sendTrx/route.ts
// Fixed version that matches your existing structure

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
    console.log("[sendTrx] Starting transaction with input:", input);
    
    try {
      const base = input.nodeUrl ?? process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://nile.trongrid.io";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (process.env.EXPO_PUBLIC_TRONGRID_API_KEY) {
        headers["TRON-PRO-API-KEY"] = process.env.EXPO_PUBLIC_TRONGRID_API_KEY;
      }

      // Get private key from environment
      const rawPk = (process.env.TRON_PRIVATE_KEY ?? process.env.EXPO_PUBLIC_TRON_PRIVATE_KEY ?? "").trim();
      if (!rawPk) {
        console.error("[sendTrx] Missing TRON_PRIVATE_KEY on server");
        return {
          result: false,
          Error: "Server misconfigured: missing TRON private key",
          txid: null
        };
      }
      
      const serverPrivateKey = rawPk.startsWith("0x") ? rawPk.slice(2) : rawPk;
      const isHex64 = /^[0-9a-fA-F]{64}$/.test(serverPrivateKey);
      if (!isHex64) {
        console.error("[sendTrx] Invalid TRON_PRIVATE_KEY format. Expect 64-hex characters.");
        return {
          result: false,
          Error: "Invalid server private key format",
          txid: null
        };
      }

      // Get owner address
      const owner = input.from ?? process.env.TRON_OWNER_ADDRESS ?? process.env.EXPO_PUBLIC_TRON_ADDRESS ?? "";
      if (!owner) {
        console.error("[sendTrx] Missing owner address");
        return {
          result: false,
          Error: "Missing owner address. Provide input.from or set TRON_OWNER_ADDRESS",
          txid: null
        };
      }

      console.log("[sendTrx] Transaction details:", {
        from: owner,
        to: input.to,
        amount: input.amountSun,
        base
      });

      // Step 1: Create transaction
      const createBody = {
        to_address: input.to,
        owner_address: owner,
        amount: input.amountSun,
        visible: true,
      };

      console.log("[sendTrx] Creating transaction...");
      const triggerRes = await fetch(`${base}/wallet/createtransaction`, {
        method: "POST",
        headers,
        body: JSON.stringify(createBody),
      });

      const triggerText = await triggerRes.text();
      console.log("[sendTrx] Create transaction response:", triggerRes.status, triggerText);

      if (!triggerRes.ok) {
        console.error("[sendTrx] createtransaction HTTP", triggerRes.status, triggerText);
        return {
          result: false,
          Error: `Failed to create transaction (${triggerRes.status}): ${triggerText}`,
          txid: null
        };
      }

      let tx: any;
      try {
        tx = JSON.parse(triggerText);
      } catch (e) {
        console.error("[sendTrx] createtransaction JSON parse fail", e, triggerText);
        return {
          result: false,
          Error: "Invalid createtransaction response - not valid JSON",
          txid: null
        };
      }

      if (tx?.Error || !tx?.raw_data) {
        console.error("[sendTrx] createtransaction logical error", tx);
        const msg = typeof tx?.Error === "string" ? tx.Error : "Create transaction error";
        return {
          result: false,
          Error: msg,
          txid: null
        };
      }

      // Step 2: Sign transaction
      console.log("[sendTrx] Signing transaction...");
      const signRes = await fetch(`${base}/wallet/gettransactionsign`, {
        method: "POST",
        headers,
        body: JSON.stringify({ transaction: tx, privateKey: serverPrivateKey }),
      });

      const signText = await signRes.text();
      console.log("[sendTrx] Sign response:", signRes.status, signText);

      if (!signRes.ok) {
        console.error("[sendTrx] sign HTTP", signRes.status, signText);
        return {
          result: false,
          Error: `Failed to sign transaction (${signRes.status}): ${signText}`,
          txid: null
        };
      }

      let signed: any;
      try {
        signed = JSON.parse(signText);
      } catch (e) {
        console.error("[sendTrx] sign JSON parse fail", e, signText);
        return {
          result: false,
          Error: "Invalid sign response - not valid JSON",
          txid: null
        };
      }

      if (!signed?.signature) {
        console.error("[sendTrx] sign logical error", signed);
        return {
          result: false,
          Error: "Signing failed: missing signature",
          txid: null
        };
      }

      // Step 3: Broadcast transaction
      console.log("[sendTrx] Broadcasting transaction...");
      const bcast = await fetch(`${base}/wallet/broadcasttransaction`, {
        method: "POST",
        headers,
        body: JSON.stringify(signed),
      });

      const bcastText = await bcast.text();
      console.log("[sendTrx] Broadcast response:", bcast.status, bcastText);

      if (!bcast.ok) {
        console.error("[sendTrx] broadcast HTTP", bcast.status, bcastText);
        return {
          result: false,
          Error: `Failed to broadcast transaction (${bcast.status}): ${bcastText}`,
          txid: null
        };
      }

      let result: any;
      try {
        result = JSON.parse(bcastText);
      } catch (e) {
        console.error("[sendTrx] broadcast JSON parse fail", e, bcastText);
        return {
          result: false,
          Error: "Invalid broadcast response - not valid JSON",
          txid: null
        };
      }

      // Extract transaction ID
      const txid: string | undefined = result?.txid ?? signed?.txID ?? signed?.txId;
      const networkBase = (base.includes("nile") ? "https://nile.tronscan.org/#/transaction/" : "https://tronscan.org/#/transaction/");
      
      console.log("[sendTrx] Transaction completed successfully:", {
        result: result.result,
        txid,
        explorerUrl: txid ? `${networkBase}${txid}` : undefined
      });

      return { 
        result: result.result ?? true, 
        txid, 
        explorerUrl: txid ? `${networkBase}${txid}` : undefined,
        Error: result.Error || null
      };

    } catch (error: any) {
      console.error("[sendTrx] Unexpected error:", error);
      return {
        result: false,
        Error: error.message || "Unexpected error occurred",
        txid: null
      };
    }
  });