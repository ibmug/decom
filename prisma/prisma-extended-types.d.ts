import { Prisma } from "@prisma/client";

declare module "@prisma/client" {
  namespace Prisma {
    interface CartItemInclude {
      inventory?: boolean | Prisma.InventoryArgs;
    }
  }
}
