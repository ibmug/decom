
import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts} from '@/lib/actions/product.actions';
//import ProductCarousel from '@/components/shared/product/product-carousel';
//import { BasicProduct, serializeProduct } from '@/lib/utils/utils';
import ViewAllProductsButton from '@/components/view-all-products-button';
export const dynamic = "force-dynamic";

const Homepage = async () => {

  
  const latestProducts = await getLatestProducts();
  //const rawfeaturedProducts = await getFeaturedProducts();
  //const featuredProducts: BasicProduct[] = rawfeaturedProducts.map(serializeProduct) 
  return (<div>
    {/* {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts}/>} */}
    {latestProducts &&
    <ProductList data={latestProducts} title="New Arrivals"
    limit={4}/>}
    <ViewAllProductsButton/>
    </div>
   );
}
 
export default Homepage;