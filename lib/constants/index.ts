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
    fullName:'Nombre',
    streetAddress:'123 Insurgentes Sur',
    city: 'Ciudad de Mexico',
    postalCode: '01234',
    country: 'Mexico'
}
