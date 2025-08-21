import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import tronGetAccount from "./routes/tron/getAccount/route";
import tronSendTrx from "./routes/tron/sendTrx/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  tron: createTRPCRouter({
    getAccount: tronGetAccount,
    sendTrx: tronSendTrx,
  }),
});

export type AppRouter = typeof appRouter;