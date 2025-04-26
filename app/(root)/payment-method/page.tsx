import {Metadata} from "next";
import {auth} from "@/auth";
import {getUserById}  from '@/lib/actions/user.actions'
import PaymenMethodForm from './payment-method-form'
import CheckoutSteps from "@/components/shared/checkout-steps";
import { ShippingAddress } from "@/types";

export const metadata: Metadata = {
    title: 'Select Payment Method',
}

const PaymentMethodPage = async () => {

    const session = await auth();
    const userId = session?.user?.id;
    
    if(!userId) throw new Error('User id not found');


    const user = await getUserById(userId)
    const address = user.address as ShippingAddress;
    const shippingMethod = address.shippingMethod;


    return (<>
     <CheckoutSteps current={2}/>
    <PaymenMethodForm preferredPaymentMethod={user.paymentMethod} shippingMethod={shippingMethod}/>
    </>)  ;
}
 
export default PaymentMethodPage;