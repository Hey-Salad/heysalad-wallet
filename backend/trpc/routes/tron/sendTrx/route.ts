import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const schema = z.object({
  fromPrivateKey: z.string().min(32),
  to: z.string().min(1),
  amountSun: z.number().int().positive(),
  nodeUrl: z.string().url().optional(),
});

export default publicProcedure
  .input(schema)
  .mutation(async ({ input }) => {
    const base = input.nodeUrl ?? process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://api.shasta.trongrid.io";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.EXPO_PUBLIC_TRONGRID_API_KEY) {
      headers["TRON-PRO-API-KEY"] = process.env.EXPO_PUBLIC_TRONGRID_API_KEY;
    }

    const triggerRes = await fetch(`${base}/wallet/createtransaction`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to_address: input.to,
        owner_address: "", // filled by sign
        amount: input.amountSun,
        visible: true,
      }),
    });

    if (!triggerRes.ok) {
      const text = await triggerRes.text();
      console.error("[tron.sendTrx] createtransaction fail", triggerRes.status, text);
      throw new Error("Failed to create transaction");
    }

    const tx = await triggerRes.json();

    // For prototype, we rely on TronGrid's signtransaction endpoint with private key
    const signRes = await fetch(`${base}/wallet/gettransactionsign`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transaction: tx,
        privateKey: input.fromPrivateKey,
      }),
    });

    if (!signRes.ok) {
      const text = await signRes.text();
      console.error("[tron.sendTrx] sign fail", signRes.status, text);
      throw new Error("Failed to sign transaction");
    }

    const signed = await signRes.json();

    const bcast = await fetch(`${base}/wallet/broadcasttransaction`, {
      method: "POST",
      headers,
      body: JSON.stringify(signed),
    });

    if (!bcast.ok) {
      const text = await bcast.text();
      console.error("[tron.sendTrx] broadcast fail", bcast.status, text);
      throw new Error("Failed to broadcast transaction");
    }

    const result = await bcast.json();
    return result as unknown;
  });