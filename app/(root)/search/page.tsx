import ProductCard from "@/components/shared/product/productCard";
import { getAllCats, getAllProducts, UIProduct } from "@/lib/actions/product.actions";


//construct the filter url
const getFilterUrl= ({
    c,
    s,
    p,
    r,
    pg
}: {
    c?: string,
    s?: string,
    p?: string,
    r?: string,
    pg?: string;
})=>{
    const params = {q,category,price,rating,sort,page}

    if(c) params.category=c;
    if(s) params.sort=s;
    if(p) params.price=p;
    if(r) params.rating=r;
    if(pg) params.page=pg;

    return `/search?${new URLSearchParams(params).toString()}`
}



const SearchPage = async (props: {
    searchParams: Promise<{
        q?: string;
        category?: string;
        price?: string;
        rating?: string;
        sort?: string;
        page?: string;
    }>
}) => {
    const {
        q='all',
        category='all',
        price='all',
        rating='all',
        sort='newest',
        page='1'
    } = await props.searchParams;

    const products = await getAllProducts({
        query: q,
        category,
        price,
        rating,
        sort,
        page:Number(page)
    })

    const categories = await getAllCats();
    console.log(categories)
    console.log(getFilterUrl)



    return (<div className="grid md:grid-cols-5 md:gap-5">
        <div className="filter-links">
            {/*filters*/}
            <div className='text-xl mb-2 mt-3'>Expansion</div>

        </div>
        <div className="md:col-span-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {products.data.length=== 0 && <div>No products found</div>}
                {products.data.map((product:UIProduct)=>(
                    <ProductCard key={product.id} product={product}/>
                ))}
            </div>
        </div>
    </div> );
}
 
export default SearchPage;