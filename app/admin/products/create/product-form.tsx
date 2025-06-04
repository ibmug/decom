'use client'
import { productDefaultValues } from "@/lib/constants";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Product } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import type { ControllerRenderProps, SubmitHandler } from "react-hook-form";
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





type ProductFormValues = z.infer<typeof insertProductSchema> & {
    id?: string
}



interface ProductFormProps {
    type: 'CREATE' | 'UPDATE';
    product?: Product;
    productId?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({type, product, productId}) => {

    const router = useRouter();
    const {toast} = useToast();
    

    const defaultValues = type === 'UPDATE' && product 
    ? updateProductSchema.parse(product)
    : productDefaultValues

    const resolver = (
        type === 'UPDATE'
          ? zodResolver(updateProductSchema)
          : zodResolver(insertProductSchema)
      ) as Resolver<ProductFormValues>
    

    const form = useForm<ProductFormValues>({
        resolver,
        defaultValues,
    });

    const {watch, setValue} = form;
        
    const images = watch('images')
    const name = watch("name");

    useEffect(() => {
  const generatedSlug = slugify(name ?? '', { lower: true, strict: true });
  setValue('slug', generatedSlug, { shouldValidate: true });
}, [name, setValue]);


    const onSubmitCustom: SubmitHandler<ProductFormValues> = async (values) => {



        
  const toastError = (msg: string) =>
    toast({ variant: 'destructive', description: msg });

  const toastSuccess = (msg: string) =>
    toast({ description: msg });

  try {
    if (type === 'CREATE') {
        const slug = slugify(values.name, {lower:true, strict: true})
        
      const dataToCreate = insertProductSchema.parse({...values,slug});
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
    toast({
        description: formatError(error)
    })
  }
};


    

    return <Form {...form}>
        <form method='POST'  onSubmit={form.handleSubmit(
    (values) => {
      // Inject slug BEFORE resolver validates
      values.slug = slugify(values.name ?? '', { lower: true, strict: true });
      onSubmitCustom(values);
    },
    (errors) => console.error("❌ Validation Errors:", errors)
  )} className='space-y-8'>
            <div className="flex flex-col md:flex-row gap-5">
                {/*Name*/}
                <FormField control={form.control}
                name='name'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'name'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Name:</FormLabel>
                        <FormControl>
                            <Input placeholder="Nombre del Producto:" {...field} />
                        </FormControl>
                    </FormItem>
                )} />

                <FormField control={form.control}
                name='slug'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'slug'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Slug:</FormLabel>
                        <FormControl>
                            <Input placeholder="auto-generated slug" {...field} readOnly />
                        </FormControl>
                    </FormItem>
                )} />
                {/*Slug*/}
                
            </div>
            <div className="flex flex-col md:flex-row gap-5">
                {/*Category*/}
                <FormField control={form.control}
                name='category'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'category'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Categoria:</FormLabel>
                        <FormControl>
                            <Input placeholder="Categoria del Producto: " {...field} />
                        </FormControl>
                    </FormItem>
                )} />
                {/*Brand*/}
                <FormField control={form.control}
                name='brand'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'brand'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Marca:</FormLabel>
                        <FormControl>
                            <Input placeholder="Wizards of the Coast" {...field} />
                        </FormControl>
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name='description' render={({field}) => (
                <FormItem className='w-full'>
                    <FormLabel>Descripcion:</FormLabel>
                    <FormControl>
                        <Textarea placeholder='Detalles del producto...' {...field} className='resize-none'/>
                    </FormControl>
                </FormItem>
            )} />

            <div className="flex flex-col md:flex-row gap-5">
                
                {/*Price*/}
                <FormField control={form.control}
                name='price'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'price'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Precio:</FormLabel>
                        <FormControl>
                            <Input placeholder="10" {...field} />
                        </FormControl>
                    </FormItem>
                )} />
                {/*Stock*/}
                <FormField control={form.control}
                name='stock'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'stock'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Cantidad disponible del Producto:</FormLabel>
                        <FormControl>
                            <Input placeholder="0-100" {...field} />
                        </FormControl>
                    </FormItem>
                )} />
            </div>
            <div className="upload-field flex flex-col md:flex-row gap-5">
                {/*Images*/}
                <FormField control={form.control}
                name='images'
                render={()=>(
                    <FormItem className='w-full'>
                        <FormLabel>Imagenes:</FormLabel>
                       <Card>
                        <CardContent className='space-y-2 mt-2 min-h-48'>
                            <div className='flex-start space-x-2'>
                                {images.map((image)=>(
                                    <Image key={image} src={image} alt="Product Image" className='w-20 h-20 object-cover object-center rounded-sm' width={100} height={100} />
                                ))}
                                <FormControl>
                                    <UploadButton endpoint='imageUploader' onClientUploadComplete={(res:{url: string}[])=>{
                                        form.setValue('images', [...images, res[0].url]);
                                    }} onUploadError={(error:Error)=>{
                                        toast({
                                            variant:'destructive',
                                            description: `Error: ${error.message}`
                                        })
                                    }} />
                                </FormControl>
                            </div>
                        </CardContent>
                       </Card>
                    </FormItem>
                )} />

            </div>

            <div>
                {/*Submit*/}
                <Button type='submit'disabled={form.formState.isSubmitting} className='button col-span-2 w-full'>
                    {form.formState.isSubmitted ? 'Submitting...' : `${type} Product`}
                </Button>
            </div>
        </form>
    </Form>;
}
 
export default ProductForm;