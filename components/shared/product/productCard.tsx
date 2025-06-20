import Image from "next/image"
import {Card, CardHeader, CardContent} from "@/components/ui/card"
import Link from "next/link"
import ProductPrice from "./productPrice"
import { UICatalogProduct } from "@/types"


const ProductCard = ({product}:{product: UICatalogProduct}) => {
    return ( <Card className='w-full max-w-sm'>
        <CardHeader className='p-0 items-center'>
            <Link href={`/product/${product.slug}`}>
            <Image src={product.images[0]} alt="{product.name}" height={300} width={300} priority={true}/>
            </Link>
        </CardHeader>
        <CardContent className='p-4 grid gap-4'>
            <div className='text-xs'>{product.type==='CARD' ? product.setCode : product.category!}</div>
            <Link href={`/product/${product.slug}`}>
            <h2 className="text-sm font-medium">{product.name}</h2>
            </Link>
            <div className="flex-between gap-4">
                <p>{product.rating} Estrellas</p>
                {product.stock>0 ? (
                    <ProductPrice value={Number(product.price)} className='text-red-500'/>
                ) : (
                    <p className="text-destructive">Sin STOCK</p>
                )}
            </div>
        </CardContent>
    </Card> );
}
 
export default ProductCard;