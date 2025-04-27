'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { CartItem } from '@/types';
import { convertToPlainObject, formatError, roundtwo } from '@/lib/utils';
import { prisma } from '@/db/prisma';
import { cartItemSchema, insertCartSchema } from '@/lib/validators';

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';

// Calculate cart price
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = roundtwo(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
  );
  const shippingPrice = roundtwo(itemsPrice > 100 ? 0 : 10);
  const taxPrice = roundtwo(0.15 * itemsPrice);
  const totalPrice = roundtwo(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    // Check for the cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Session Cart Id not found');

    // Get authenticated user (if any)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get existing cart (either by user or by session)
    const cart = await getMyCart();

    // Validate incoming item
    const item = cartItemSchema.parse(data);
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new Error('Product not found');

    // If no cart exists yet, create one
    if (!cart) {
      const newCart = insertCartSchema.parse({
        userId,
        sessionCartId,
        items: [item],
        ...calcPrice([item]),
      });
      await prisma.cart.create({ data: newCart });
      revalidatePath(`/product/${product.slug}`);
      return { success: true, message: `${product.name} added to cart.` };
    }

    // Cart exists: update quantity or add new
    const items = [...cart.items] as CartItem[];
    const exists = items.find((x) => x.productId === item.productId);
    if (exists) {
      if (product.stock < exists.qty + 1) throw new Error('Not enough stock');
      exists.qty += 1;
    } else {
      if (product.stock < 1) throw new Error('Not enough stock');
      items.push(item);
    }

    // Persist update
    await prisma.cart.update({
      where: { id: cart.id },
      data: { items, ...calcPrice(items) },
    });

    revalidatePath(`/product/${product.slug}`);
    return {
      success: true,
      message: `${product.name} ${exists ? 'updated in' : 'added to'} cart.`,
    };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export async function getMyCart() {
  // Look up cart by session cookie or user
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('Session Cart Id not found');

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const cart = await prisma.cart.findFirst({
    where: userId
      ? { userId }
      : { sessionCartId },
  });

  if (!cart) return undefined;

  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
  });
}

export async function removeItemFromCart(productId: string) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Session Cart Id not found');

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const cart = await getMyCart();
    if (!cart) throw new Error('Cart not found');

    // Decrement or remove
    const items = (cart.items as CartItem[]).map((x) => ({ ...x }));
    const idx = items.findIndex((x) => x.productId === productId);
    if (idx === -1) throw new Error('Product not in cart');

    if (items[idx].qty === 1) {
      items.splice(idx, 1);
    } else {
      items[idx].qty -= 1;
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { items, ...calcPrice(items) },
    });

    revalidatePath(`/product/${product.slug}`);
    return { success: true, message: `${product.name} removed from cart.` };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}
