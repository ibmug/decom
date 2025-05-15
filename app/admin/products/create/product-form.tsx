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
import { createProduct, updateProduct } from "@/lib/actions/product.actions";


interface ProductFormProps {
    type: 'CREATE' | 'UPDATE';
    product?: Product;
    productId?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({type, product, productId}) => {

    const router = useRouter();
    const {toast} = useToast();

    const form = useForm<z.infer<typeof insertProductSchema>>({
        resolver: 
            type === 'UPDATE' 
            ? zodResolver(updateProductSchema) 
            : zodResolver(insertProductSchema),
        defaultValues: product && type === 'UPDATE' 
        ? product 
        : productDefaultValues
    });

    const onSubmitCustom: SubmitHandler<z.infer<typeof insertProductSchema>> = async (values) => {
        //On Create
        if (type==='CREATE'){
            const res = await createProduct(values);

            if(!res.success) {
                toast({
                    variant:'destructive',
                    description:res.message
                });
            } else {
                toast({
                    description:res.message
                });
               router.push('/admin/products')
            }
        }
        //On Update
        if (type==='UPDATE'){
            

            if (!productId){
            router.push('/admin/products')
            return;
            }

            const res = await updateProduct(values);

            if(!res.success) {
                toast({
                    variant:'destructive',
                    description:res.message
                })
            } else {
                toast({
                    variant:'default',
                    description:res.message
                });
                router.push('/admin/products')
            }
        }
    }

    return <Form {...form}>
        <form method='POST'  onSubmit={form.handleSubmit(onSubmitCustom)} className='space-y-8'>
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
                {/*Slug*/}
                <FormField control={form.control}
                name='slug'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'slug'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Slug:</FormLabel>
                        <FormControl>
                            <div className='relative'>
                            <Input placeholder="Pon el codigo de producto:" {...field} />
                            <Button type='button' className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2' onClick={()=>{form.setValue('slug', slugify(form.getValues('name'), {lower:true}))}}>Generar</Button>
                            </div>
                        </FormControl>
                    </FormItem>
                )} />
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
            </div>
            <div className="upload-field">
                {/*isfeatured*/}
            </div>
            <div>
                {/*Description*/}
                <FormField control={form.control}
                name='description'
                render={({field}:{field:ControllerRenderProps<z.infer<typeof insertProductSchema>, 'description'>; })=>(
                    <FormItem className='w-full'>
                        <FormLabel>Descripcion:</FormLabel>
                        <FormControl>
                            <Textarea placeholder='Este producto es lo ultimo en tecnologia...' {...field} className='resize-none'/>
                        </FormControl>
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