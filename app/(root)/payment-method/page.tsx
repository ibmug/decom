import {Metadata} from "next";
import {getUserById}  from '@/lib/actions/user.actions'
import PaymenMethodForm from './payment-method-form'
import CheckoutSteps from "@/components/shared/checkout-steps";
import { ShippingAddress } from "@/types";
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/authOptions';
import { redirect } from "next/navigation";
export const metadata: Metadata = {
    title: 'Select Payment Method',
}

const PaymentMethodPage = async () => {

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if(!userId) throw new Error('User id not found');


    const user = await getUserById(userId)
    if (!user.address) {

        console.error("Shipping address not found");
        redirect('/shipping-address')
        
    }

    const address = user.address as ShippingAddress;
    const shippingMethod = address.shippingMethod;


    return (<>
     <CheckoutSteps current={2}/>
    <PaymenMethodForm preferredPaymentMethod={user.paymentMethod} shippingMethod={shippingMethod}/>
    </>)  ;
}
 
export default PaymentMethodPage;