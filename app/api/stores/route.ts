
import { NextResponse } from 'next/server';

const demoStores = [
  { id: '1', name: 'Shivan Shop', address: 'Ajusco 46, Portales Sur, Benito Juarez 03300, Ciudad de Mexico' },
  { id: '2', name: 'Goma Shop', address: 'Fresas con Crema 44' },
];


export async function GET() {
  return NextResponse.json(demoStores);
}