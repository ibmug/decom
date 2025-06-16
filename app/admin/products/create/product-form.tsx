'use client'

import { accessoryDefaultValues } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { UIStoreProduct } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import type { SubmitHandler } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import slugify from 'slugify'
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image'
import { Resolver } from "react-hook-form";
import { formatError } from "@/lib/utils/utils";
import { useEffect } from "react";

type ProductFormValues = z.infer<typeof insertProductSchema> & { id?: string }

type ProductFormProps =
  | { type: 'CREATE'; product?: never; productId?: never; }
  | { type: 'UPDATE'; product: UIStoreProduct; productId: string };

const ProductForm: React.FC<ProductFormProps> = ({ type, product, productId }) => {

  const router = useRouter();
  const { toast } = useToast();

  // Fully normalized default values
  const defaultValues: ProductFormValues =
    type === 'UPDATE' && product
      ? (
          product.type === 'CARD'
            ? {
                type: 'CARD',
                id: product.id,
                slug: product.slug,
                cardMetadataId: product.cardMetadata.id, // required
                storeId: null,
                rating: product.rating ?? 0,
                numReviews: product.numReviews ?? 0,
                images: product.images,
                inventory: product.inventory,
              }
            : {
                type: 'ACCESSORY',
                id: product.id,
                slug: product.slug,
                name: product.accessory.name,
                description: product.accessory.description ?? '',
                brand: product.accessory.brand ?? '',
                category: product.accessory.category,
                accessoryId: null,
                storeId: null,
                rating: product.rating ?? 0,
                numReviews: product.numReviews ?? 0,
                images: product.images,
                inventory: product.inventory,
              }
        )
      : accessoryDefaultValues;

  const resolver = (
    type === 'UPDATE'
      ? zodResolver(updateProductSchema)
      : zodResolver(insertProductSchema)
  ) as Resolver<ProductFormValues>

  const form = useForm<ProductFormValues>({ resolver, defaultValues });

  const { watch, setValue } = form;
  const images = watch('images');
  const productType = watch("type");
  const accessoryName = watch("name");

  useEffect(() => {
    let generatedSlug = "";

    if (productType === 'ACCESSORY') {
      generatedSlug = slugify(accessoryName ?? '', { lower: true, strict: true });
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
    // For CARD slugs we don't autogenerate (card slugs come from metadata)
  }, [accessoryName, productType, setValue]);

  const onSubmitCustom: SubmitHandler<ProductFormValues> = async (values) => {
    const toastError = (msg: string) => toast({ variant: 'destructive', description: msg });
    const toastSuccess = (msg: string) => toast({ description: msg });

    try {
      if (type === 'CREATE') {
        const dataToCreate = insertProductSchema.parse(values);
        const res = await fetch('/api/products/create', {
          method: 'POST',
          body: JSON.stringify(dataToCreate),
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await res.json();
        if (!json.success) return toastError(json.message);
        toastSuccess(json.message);
        router.push('/admin/products');
      }

      if (type === 'UPDATE') {
        if (!productId) return router.push('/admin/products');
        const dataToUpdate = updateProductSchema.parse(values);

        const res = await fetch('/api/products/update', {
          method: 'POST',
          body: JSON.stringify(dataToUpdate),
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await res.json();
        if (!json.success) return toastError(json.message);
        toastSuccess(json.message);
        router.push('/admin/products');
      }
    } catch (error: unknown) {
      toast({ description: formatError(error) });
    }
  };

  return (
    <Form {...form}>
      <form method='POST' onSubmit={form.handleSubmit(onSubmitCustom)} className='space-y-8'>

        {/* Type selector */}
        <div className="flex flex-col md:flex-row gap-5">
          <FormField control={form.control} name='type' render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Product Type:</FormLabel>
              <FormControl>
                <select {...field} className="input">
                  <option value="ACCESSORY">Accessory</option>
                  <option value="CARD">Card</option>
                </select>
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name='slug' render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Slug:</FormLabel>
              <FormControl><Input {...field} readOnly /></FormControl>
            </FormItem>
          )} />
        </div>

        {/* Accessory Fields */}
        {productType === 'ACCESSORY' && (
          <>
            <FormField control={form.control} name='name' render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Name:</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="flex flex-col md:flex-row gap-5">
              <FormField control={form.control} name='category' render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Category:</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name='brand' render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Brand:</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='description' render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Description:</FormLabel>
                <FormControl><Textarea {...field} className='resize-none' /></FormControl>
              </FormItem>
            )} />
          </>
        )}

        {/* Images */}
        <FormField control={form.control} name='images' render={() => (
          <FormItem className='w-full'>
            <FormLabel>Images:</FormLabel>
            <Card>
              <CardContent className='space-y-2 mt-2 min-h-48'>
                <div className='flex-start space-x-2'>
                  {images.map((image) => (
                    <Image key={image} src={image} alt="Product Image" className='w-20 h-20 object-cover object-center rounded-sm' width={100} height={100} />
                  ))}
                  <FormControl>
                    <UploadButton endpoint='imageUploader' onClientUploadComplete={(res: { url: string }[]) => {
                      form.setValue('images', [...images, res[0].url]);
                    }} onUploadError={(error: Error) => {
                      toast({ variant: 'destructive', description: `Error: ${error.message}` });
                    }} />
                  </FormControl>
                </div>
              </CardContent>
            </Card>
          </FormItem>
        )} />

        <Button type='submit' disabled={form.formState.isSubmitting} className='button col-span-2 w-full'>
          {form.formState.isSubmitting ? 'Submitting...' : `${type} Product`}
        </Button>

      </form>
    </Form>
  );
};

export default ProductForm;
