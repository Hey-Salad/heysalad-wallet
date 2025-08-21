import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const schema = z.object({
  address: z.string().min(1),
});

export default publicProcedure
  .input(schema)
  .query(async ({ input }) => {
    const url = `${process.env.EXPO_PUBLIC_TRONGRID_URL ?? "https://api.shasta.trongrid.io"}/v1/accounts/${encodeURIComponent(input.address)}`;
    const res = await fetch(url, {
      headers: {
        "TRON-PRO-API-KEY": process.env.EXPO_PUBLIC_TRONGRID_API_KEY ?? "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[tron.getAccount] HTTP", res.status, text);
      throw new Error(`TronGrid getAccount failed: ${res.status}`);
    }

    const data = (await res.json()) as unknown;
    return data as unknown;
  });