import { UIStoreProduct } from "@/types";

//TypeGuard:
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isUIStoreProduct(p: UIStoreProduct | null): p is UIStoreProduct {
  return p !== null;
}

/**
 * Generic type guard for enum validation.
 * Ensures a value is a valid member of a given enum.
 */
export function isValidEnumValue<T extends Record<string, string | number>>(
  value: unknown,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}
