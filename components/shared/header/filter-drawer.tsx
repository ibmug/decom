'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { MenuIcon } from 'lucide-react'
import { CARD_COLORS, CARD_TYPES, SET_CODES } from '@/lib/constants'

const FilterDrawer = () => {
  const router = useRouter()

  const [type, setType] = useState('both')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [manaCost, setManaCost] = useState('')
  const [cardColor, setCardColor] = useState<string[]>([])
  const [cardType, setCardType] = useState('')
  const [setCode, setSetCode] = useState('')
  const [exactColorsOnly, setExactColorsOnly] = useState(false)
  const sp = useSearchParams()


  
const toggleColor = (color: string) => {
  setCardColor((prev) =>
    prev.includes(color)
      ? prev.filter((c) => c !== color)
      : [...prev, color]
  )
}

useEffect(() => {
  const initialColors = sp.get('colors')?.split(',').filter(Boolean) || []
  setCardColor(initialColors)

  const exact = sp.get('colorsExact') === 'true'
  setExactColorsOnly(exact)

  setType(sp.get('type') ?? 'both')
  setMinPrice(sp.get('minPrice') ?? '')
  setMaxPrice(sp.get('maxPrice') ?? '')
  setManaCost(sp.get('manaCost') ?? '')
  setCardType(sp.get('cardType') ?? '')
  setSetCode(sp.get('set') ?? '')
}, [])



useEffect(() => {
  if (type === 'ACCESSORY') {
    setManaCost('')
    setCardType('')
    setCardColor([])
    setExactColorsOnly(false)
  }
}, [type])




const applyFilters = () => {
  //const params = new URLSearchParams(sp.toString()) // Start with existing params
  const params = new URLSearchParams()
sp.forEach((value, key) => params.set(key, value))


  // Overwrite or add new values
  if (type !== 'both') params.set('type', type)
  else params.delete('type') // clean up if reset

  if (minPrice) params.set('minPrice', minPrice)
  else params.delete('minPrice')

  if (maxPrice) params.set('maxPrice', maxPrice)
  else params.delete('maxPrice')

  if (manaCost) params.set('manaCost', manaCost)
  else params.delete('manaCost')

  if (cardType) params.set('cardType', cardType)
  else params.delete('cardType')

  if (setCode) params.set('set', setCode)
  else params.delete('setCode')

  if (cardColor.length > 0) {
    params.set('colors', cardColor.join(','))
    if (exactColorsOnly) params.set('colorsExact', 'true')
    else params.delete('colorsExact')
  } else {
    params.delete('colors')
    params.delete('colorsExact')
  }

  router.push(`/search?${params.toString()}`)
}
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button variant="outline">
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full max-w-sm p-4">
        <DrawerHeader>
          <DrawerTitle>Narrow Your Search</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 mt-4">
          <select onChange={(e) => setType(e.target.value)} value={type}>
            <option value="both">Both</option>
            <option value="CARD">Cards</option>
            <option value="ACCESSORY">Other Products</option>
          </select>
        <div className='list-inside'>
          <input type="text" placeholder="Mana Cost (e.g. 1W)" value={manaCost} onChange={(e) => setManaCost(e.target.value)} />
          <div className="space-y-2">
  <p className="font-semibold">Card Colors</p>
 {CARD_COLORS.map((color) => (
  <label key={color.code} className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={cardColor.includes(color.code)}
      onChange={() => toggleColor(color.code)}
      value={color.code}
    />
    <span>{color.name}</span>
  </label>
))}
<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={exactColorsOnly}
    onChange={() => setExactColorsOnly(prev => !prev)}
  />
  <span>Only these colors</span>
</label>
</div>
          <div>
          <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
          <option value="">Any Card Type</option>
  {CARD_TYPES.map((cardType) => (
    <option key={cardType} value={cardType}>
      {cardType}
    </option>
  ))}
  </select>
  </div>
          <select value={setCode} onChange={(e) => setSetCode(e.target.value)}>
  <option value="">All Sets</option>
  {SET_CODES.map((set) => (
    <option key={set.code} value={set.code}>
      {set.name}
    </option>
  ))}
</select>
        </div>
          <DrawerClose asChild>
            <Button onClick={applyFilters}>Apply</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default FilterDrawer
