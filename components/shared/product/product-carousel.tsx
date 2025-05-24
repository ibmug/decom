'use client'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { BasicProduct } from "@/lib/utils/utils";
import Autoplay from 'embla-carousel-autoplay'
import Link from "next/link";
import Image from "next/image";


const ProductCarousel = ({data}: {data:BasicProduct[]}) => {
    return (<Carousel className='w-full mb-12' opts={{loop: true}} plugins={[Autoplay({delay:10000, stopOnInteraction:true, stopOnMouseEnter:true})]}>
        <CarouselContent>
            {data.map((featuredProduct: BasicProduct)=>(
                <CarouselItem key={featuredProduct.id}>
                    <Link href={`/product/${featuredProduct.slug}`}>
                    <div className="relative mx-auto">
                        <Image src={featuredProduct.banner!} alt={featuredProduct.name} height='0' width='0' sizes='100vw' className='w-full h-auto'/>
                        <div className="absolute inset-0 flex items-end justify-center">
                            <h2 className="bg-gray-900 opacity-50 text-2xl font-bold px-2 text-white">{featuredProduct.name}</h2>
                        </div>
                    </div>
                    </Link>
                </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext/>
    </Carousel> );
}
 
export default ProductCarousel;