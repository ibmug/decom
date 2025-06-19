'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type UIStoreProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { insertAccessoryProductSchema } from '@/lib/validators';
import { UploadButton } from '@/lib/uploadthing';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export type ProductFormValues = z.infer<typeof insertAccessoryProductSchema>;

interface ProductFormProps {
  type: 'CREATE' | 'UPDATE';
  product?: UIStoreProduct;
}

export default function ProductForm({ type, product }: ProductFormProps) {
  const defaultValues: ProductFormValues =
    type === 'UPDATE' && product && product.type === 'ACCESSORY'
      ? {
          

          price: product.price,
          images: product.images,
          name: product.accessory.name,
          description: product.description ?? '',
          brand: product.brand ?? '',
          category: product.category ?? '',
          stock: product.inventory.reduce((sum, i) => sum + i.stock, 0),
        }
      : {
          
          price: 0.0,
          images: [],
          name: '',
          description: '',
          brand: '',
          category: '',
          stock:1,
        };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(insertAccessoryProductSchema),
    defaultValues,
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const { isSubmitting } = formState;
  const { toast } = useToast();
  const router = useRouter();
  const images = watch('images');

  const handleImageUpload = (res: { url: string }[]) => {
    setValue('images', [...images, res[0].url]);
  };

  const onSubmit = async (data: ProductFormValues) => {
  console.log('submitting', data);
  try {
    const response = await fetch('/api/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message || 'Error creating product',
      });
    } else {
      toast({
        description: 'Product created successfully!',
      });
      router.push('/admin/products');
    }
  } catch (err) {
    toast({
      variant: 'destructive',
      description: 'Unexpected error submitting product.',
    });
    console.error(err);
  }
};


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-6">
          <h3 className="text-lg font-bold pt-4">Accessory Details</h3>
          <p>Name:</p>
          <Input placeholder="Name" {...register('name')} />
          <p>Description:</p>
          <Textarea placeholder="Description" {...register('description')} />
          <p>Brand:</p>
          <Input placeholder="Brand" {...register('brand')} />
          <p>Category:</p>
          <Input placeholder="Category" {...register('category')} />
          <p>Price:</p>
          <Input
            placeholder="Price"
            type="number"
            {...register('price', { valueAsNumber: true })}
          />

         <h3 className="text-lg font-semibold pt-4">Images</h3>
<UploadButton
  endpoint="imageUploader"
  onClientUploadComplete={handleImageUpload}
  onUploadError={(error: Error) => {
    toast({
      variant: 'destructive',
      description: `ERROR! ${error.message}`,
    });
  }}
/>


{images.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
    {images.map((url, i) => (
      <Image
        key={i}
        src={url}
        alt={`Product Image ${i + 1}`}
        width={75}
        height={75}
        className="rounded border p-1 object-cover w-full h-32"
      />
    ))}
  </div>  
)}

<p className="text-sm text-muted-foreground pt-2">
  Make sure all details are correct before submitting product.
</p>

        </CardContent>
      </Card>
  
      <Button type="submit" disabled={isSubmitting} >
        {type === 'CREATE' ? 'Create' : 'Update'} Product
      </Button>
      
    </form>
  );
}
