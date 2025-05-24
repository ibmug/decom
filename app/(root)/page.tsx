
import ProductList from '@/components/shared/product/product-list';
import {getFeaturedProducts, getLatestProducts} from '@/lib/actions/product.actions';
import ProductCarousel from '@/components/shared/product/product-carousel';
import { BasicProduct, serializeProduct } from '@/lib/utils/utils';
import ViewAllProductsButton from '@/components/view-all-products-button';
export const dynamic = "force-dynamic";

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const rawfeaturedProducts = await getFeaturedProducts();
  const featuredProducts: BasicProduct[] = rawfeaturedProducts.map(serializeProduct) 
  return (<>
    {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts}/>}
    <ProductList data={latestProducts.data} title="New Arrivals"
    limit={4}/>
    <ViewAllProductsButton/>
    </>
   );
}
 
export default Homepage;