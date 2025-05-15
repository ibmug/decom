import {Metadata} from 'next';
import ProductForm from './product-form';


export const metadata: Metadata = {
    title: 'Create New Product'
}


const CreateProductPage = () => {
    return (<>
    <h2 className="h2-bold">Create Product</h2>
    <div className="my-8">
        <ProductForm type='CREATE' />
    </div>
    </> );
}
 
export default CreateProductPage;