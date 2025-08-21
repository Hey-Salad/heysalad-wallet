import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const schema = z.object({
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

    const serverPrivateKey = process.env.TRON_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
    if (!serverPrivateKey || serverPrivateKey.length < 32) {
      console.error("[tron.sendTrx] Missing TRON_PRIVATE_KEY on server");
      throw new Error("Server misconfigured: missing TRON private key");
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

    const signRes = await fetch(`${base}/wallet/gettransactionsign`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transaction: tx,
        privateKey: serverPrivateKey,
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