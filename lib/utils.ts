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

//Format Errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatError(error: any) {
  if(error.name ==='ZodError'){
    //Handle Zod Error
    //errors is the object which contains type/includisve/exact/message..., we get the value 'message' from all the errors shown and pass them over as a joined string.
    const fieldErrors = Object.keys(error.errors).map((field)=>error.errors[field].message);
    return fieldErrors.join('.  ')
  } else if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
    //Prisma error
    const field = error.meta?.target ? error.meta.target[0] : 'Field';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
  } else {
    //handle other errors.
    return typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
  }
}


//Round Number to two decimals

export function roundtwo(value: number|string){

  if(typeof value==='number'){
    //We're rounding the number provided to two decimals, EPSILON * 100 and then divided b y 100
    //help us with the rounding    
    return Math.round((value + Number.EPSILON) * 100) / 100
  } else if(typeof value ==='string') {
    throw new Error ("You sent a string!") 

  }else {
    throw new Error ("Wrong type for rounding")
  }
}


const CURRENCY_FORMATER =  new Intl.NumberFormat('en-US', {
  currency:'USD',
  style:'currency',
  minimumFractionDigits:2
})

//Format Currency using the 'currencyFormater'

export function formatCurrency(amount: number|string|null){
  if(typeof amount==='number'){
    return CURRENCY_FORMATER.format(amount)
  } else if (typeof amount ==='string'){
    return CURRENCY_FORMATER.format(Number(amount))
  } else {
    return 'NaN'
  }
}

export function isSafeRedirect(url: string) {
  const base = new URL(process.env.NEXTAUTH_URL!);
  const dest = new URL(url, base);
  return dest.origin === base.origin;
}