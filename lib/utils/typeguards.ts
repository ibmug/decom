import { UIStoreProduct } from "@/types";

//TypeGuard:
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isUIStoreProduct(p: UIStoreProduct | null): p is UIStoreProduct {
  return p !== null;
}