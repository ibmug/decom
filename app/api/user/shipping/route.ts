import { NextResponse, NextRequest } from 'next/server'
import { getToken }                 from 'next-auth/jwt'
import { updateUserAddress }        from '@/lib/actions/user.actions'
import { getMyCart }                from '@/lib/actions/cart.actions'
import { prisma }                   from '@/db/prisma'
import { shippingAddressSchema } from '@/lib/validators'


const secret = process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
  // 1) Check the JWT from the cookie
  const token = await getToken({ req, secret });
  if (!token?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Parse + validate
  let data;
  try {
    data = await req.json();
    const result = shippingAddressSchema.safeParse(data);
    if(!result.success){
      return NextResponse.json({
        errors:result.error.flatten(),
        status:400})
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3) Delegate to server‐side logic
  const result = await updateUserAddress({
    ...data,
    // force the userId from the token, not from client data
    userId: token.sub,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  //if the user chose in‐store pickup, force shippingPrice to 0
  
  if (data.shippingMethod === 'PICKUP') {
    // fetch their cart
    const cart = await getMyCart()
    if (cart) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { shippingPrice: 0 },      // zero it out
      })
    }
  }

  return NextResponse.json({ ok: true });
}
