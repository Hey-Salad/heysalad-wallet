import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
});

export type AppRouter = typeof appRouter;