import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


//Convert prisma object into regular js object
export function convertToPlainObject <T>(value: T): T{
  //<T> is a Typescript generic placeholder, and value T is 'inferred', similar to 'var or ?' - But they need to match, thats why we use the 3 T's
  return JSON.parse(JSON.stringify(value));
  
}

//Format number with decimal places
//export function formatNumberWithDecimal (num): string{
  //const [int,decimal] = num.toString().split('.');
  //if decimal exists, return decimal with some padding (ex. 1.9 will show 1.90, else(:) just return the int.00 (ex 2.00))
  //return decimal ? `${int}.${decimal.padEnd(2,'0')}` : `${int}.00`
//}
export function formatNumberWithDecimal(num: string | number): string {
  const [int, decimal] = num.toString().split('.');
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}