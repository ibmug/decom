// utils/cartUtils.ts
import { roundtwo } from "./utils"

export interface PriceCalcItem {
  price: string
  qty:   number
}

export function calcPrice(items: PriceCalcItem[]) {
  const itemsValue    = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)
  const itemsPrice    = roundtwo(itemsValue)
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10)
  const taxPrice      = roundtwo(0.15 * itemsPrice)
  const totalPrice    = roundtwo(itemsPrice + shippingPrice + taxPrice)

  return {
    itemsPrice:    itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice:      taxPrice.toFixed(2),
    totalPrice:    totalPrice.toFixed(2),
  }
}
