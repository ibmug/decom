'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';
import { z } from 'zod';
import {
  shippingAddressSchema,
  
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
} from '@/lib/validators';
import { hashSync } from 'bcrypt-ts-edge';
import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils/utils';
import type { ShippingAddress } from '@/types';
import { PAGE_SIZE } from '../constants';
import { Prisma, User } from '@prisma/client';
import { revalidatePage } from './server/product.server.actions';


//These are the options provided by the params in the admin user page.
interface GetUserOpts {
  page:number
  limit: number
  query?: string
  category?: string
  orderBy: keyof User
  order?: "asc" | "desc"
}


export async function signUpUser(_prevState:unknown, formData: FormData):Promise <{success:boolean; message:string}> {
  try {
    // 1) Grab raw values from the FormData
    const raw = {
      name:            formData.get('name')?.toString()            ?? '',
      email:           formData.get('email')?.toString()           ?? '',
      password:        formData.get('password')?.toString()        ?? '',
      confirmPassword: formData.get('confirmPassword')?.toString() ?? '',
    }

    // 2) Validate using your existing schema
    const { name, email, password } = signUpFormSchema.parse(raw)

    // 3) Hash & persist
    const hashed = hashSync(password, 10)
    await prisma.user.create({ data: { name, email, password: hashed } })

    return { success: true, message: 'Account created successfully' }
  } catch (err) {
    const message = await formatError(err)
    return { success: false, message }
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return user;
}


interface UpdateAddressInput extends ShippingAddress {
  userId: string;
}
// Update user address
export async function updateUserAddress(data: UpdateAddressInput) {
  try {
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        address:data
      },
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to update user address' };
  }
}

// Update payment method
export async function updateUserPayment(data: z.infer<typeof paymentMethodSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Not authenticated');
    const userId = session.user.id;

    const { type } = paymentMethodSchema.parse(data);
    await prisma.user.update({
      where: { id: userId },
      data: { paymentMethod: type },
    });

    return { success: true, message: 'Payment method updated.' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


export async function requireShippingAddress(): Promise<ShippingAddress> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { address: true },
  });
  if (!user?.address) {
    throw new Error('No shipping address on file');
  }

  const parsed = shippingAddressSchema.safeParse(user.address);
  if (!parsed.success) {
    // Could log parsed.error here if you want
    throw new Error('Stored shipping address is invalid, please re-enter.');
  }

  return parsed.data;
}


///Update the user profile

export async function updateProfile(user: {name: string, email: string}) {
  try{
    const session = await getServerSession(authOptions);
    const currentUser = await prisma.user.findFirst({
      where:{
        id:session?.user?.id
      }
    });
    if(!currentUser) throw new Error('user not found, please login')

    await prisma.user.update({
      where:{
        id: currentUser.id
      },
       data:{
        name:user.name
      }
    });

    return {success:true, message: 'User Updated Succesfully'}
    }catch(err){
    return {success:false, message: formatError(err)}
  }
}

//get all users

export async function getAllUsers({
  limit = PAGE_SIZE,
  page
}:{
  limit?: number;
  page: number;
}){
  const data = await prisma.user.findMany({
    orderBy:{createdAt: 'desc'},
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    totalPages:Math.ceil(dataCount/limit),
    data,
  }
}


//get All filtered users:
export async function getAllFilteredUsers({
  query     = "",
  page      = 1,
  limit     = PAGE_SIZE,
  category,                   // optional, if you still need it
  orderBy   = "name",         // default sort field
  order     = "asc",          // default sort order
}: GetUserOpts) {
  // 1) Build a proper UserWhereInput
  const where: Prisma.UserWhereInput = {}

  if (category) {
    // if you still want to filter by category—though
    // your User model probably doesn’t have `category`.
    Object.assign(where, { role: category })
  }

  if (query) {
    where.OR = [
      { name:  { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ]
  }

  // 2) Run the transaction with dynamic orderBy
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip:  (page - 1) * limit,
      take:  limit,
      orderBy: { [orderBy]: order },
    }),
    prisma.user.count({ where }),
  ])

  // 3) Compute total pages
  const totalPages = Math.ceil(total / limit)

  return { data, totalPages }
}


export async function deleteUser(id:string): Promise<{ success: boolean; message: string }> {
    try{
        await prisma.user.delete({where:{id}})
        revalidatePage('/admin/users')
        return {success:true, message: 'User Deleted Succesfully.'}
    }catch (err){
        return {success:false, message: formatError(err)}
    } 
}


//update the user

export async function updateUser(user: z.infer<typeof updateUserSchema>){
  try{

    await prisma.user.update({
      where:{id: user.id},
      data:{
        name: user.name,
        role: user.role
      }
    })

    revalidatePage('/admin/users')

    return {success:true, message: 'User updated succesfully!'}

  }catch(err){
    return {success:false, message: formatError(err)}
  }
}