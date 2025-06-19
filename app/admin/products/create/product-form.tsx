'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type UIStoreProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { updateProductSchema } from '@/lib/validators';

export type ProductFormValues = z.infer<typeof updateProductSchema>;

interface ProductFormProps {
  type: 'CREATE' | 'UPDATE';
  product?: UIStoreProduct;
}

export default function ProductForm({ type, product }: ProductFormProps) {
  const defaultValues: ProductFormValues =
    type === 'UPDATE' && product
      ? product.type === 'CARD'
        ? {
            id: product.id,
            type: 'CARD',
            slug: product.slug,
            cardMetadataId: product.cardMetadata.id,
            price: product.price,
            rating: product.rating ?? 0,
            numReviews: product.numReviews ?? 0,
            images: product.images,
            inventory: product.inventory.map((inv) => ({
              id: inv.id,
              stock: inv.stock,
              language: inv.language,
              condition: inv.condition,
            })),
          }
        : {
            id: product.id,
            type: 'ACCESSORY',
            slug: product.slug,
            accessoryId: product.accessory.id,
            price: product.price,
            rating: product.rating ?? 0,
            numReviews: product.numReviews ?? 0,
            images: product.images,
            name: product.accessory.name,
            description: product.description ?? '',
            brand: product.brand ?? '',
            category: product.category ?? '',
            inventory: product.inventory.map((inv) => ({
              id: inv.id,
              stock: inv.stock,
              language: inv.language,
              condition: inv.condition,
            })),
          }
      : {
          // CREATE mode defaults to accessory only
          id: '',
          type: 'ACCESSORY',
          slug: '',
          accessoryId: '',
          price: 0.00,
          rating: 0,
          numReviews: 0,
          images: [],
          name: '',
          description: '',
          brand: '',
          category: '',
          inventory: [],
        };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues,
  });

  const handleSubmit = (data: ProductFormValues) => {
    console.log('Submit:', data); // You can replace this with a mutation
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <Input placeholder="Slug" {...form.register('slug')} />
          <Input placeholder="Price" {...form.register('price')} />
          <Input placeholder="Rating" type="number" {...form.register('rating', { valueAsNumber: true })} />
          <Input placeholder="Num Reviews" type="number" {...form.register('numReviews', { valueAsNumber: true })} />
        </CardContent>
      </Card>

      <Button type="submit">{type === 'CREATE' ? 'Create' : 'Update'} Product</Button>
    </form>
  );
}
