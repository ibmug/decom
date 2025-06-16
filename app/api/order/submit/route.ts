import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { createOrder } from '@/lib/actions/order.actions';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const result = await createOrder();

    if (result.success) {
      return NextResponse.json({ success: true, orderId: result.data?.orderId });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

  } catch (err: unknown) {
    console.error('❌ Order submission failed:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
