export const APP_NAME = process.env.PUBLIC_APP_NAME || 'Tiendita';
export const APP_DESCRIPTION =  process.env.PUBLIC_DESCRIPTION || 'Una tiendita, con 2x1 y todo'
export const SERVER_URL = process.env.PUBLIC_SERVER_URL || 'http://localhost:3000'
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;


export const signInDefaultValues = {
    email:'',
    password:''
};

export const signUpDefaultValues = {
    email:'',
    password:'',
    name:'',
    confirmPassword:'',
};

export const shippingAddressDefaultValues = {
    fullName:'Nombre de ubicacion',
    streetAddress:'Nombre de tu Calle, Delegacion y Colonia',
    city: 'Nombre de tu Ciudad',
    postalCode: '01234',
    country: 'Tu Pais'
}


export const PAYMENT_METHODS = process.env.PAYMENT_METHODS ? process.env.PAYMENT_METHODS.split(', '): ['PayPal', 'Stripe','CashOnPickup'];
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD

export const PAGE_SIZE= Number(process.env.PAGE_SIZE) || 10;

export const productDefaultValues = {
    name: '',
    slug: '',
    category: '',
    images: [],
    brand: '',
    description: '',
    price: '0',
    stock: 0,
    rating: '0',
    numReviews: '0',
    isFeatured: false,
    banner: null,
}


export const USER_ROLES = process.env.USER_ROLES ? process.env.USER_ROLES.split(', ') : ['admin', 'user'] 



