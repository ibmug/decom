import { generateAccessToken, paypalUtils } from "../lib/paypalUtils";


//Test to generate access token from payopal
test('Generates a token from Paypal', async()=>{
    const tokenResponse = await generateAccessToken();
    
    expect(typeof tokenResponse).toBe('string');
    expect(tokenResponse.length).toBeGreaterThan(0);
});

//Test to create a paypalk order

test('Creates a paypal order', async ()=>{
    const token = await generateAccessToken();
    const price = 1.0;

    const orderResponse = await paypalUtils.createOrder(price);
    

    expect(orderResponse).toHaveProperty('id');
    expect(orderResponse).toHaveProperty('status');
    expect(orderResponse.status).toBe('CREATED')


})


///Test to capture payment with mock order
test('Simulate Capturing a payment from an order', async ()=>{
    const orderId='100';
    const mockCapturePayment = jest.spyOn(paypalUtils,'capturePayment').mockResolvedValue({
        status:'COMPLETED',
    })

    const captureResponse = await paypalUtils.capturePayment(orderId);
    expect(captureResponse).toHaveProperty('status', 'COMPLETED');

    mockCapturePayment.mockRestore();

})
