export const APP_NAME = process.env.PUBLIC_APP_NAME || 'Tiendita';
export const APP_DESCRIPTION =  process.env.PUBLIC_DESCRIPTION || 'Una tiendita, con 2x1 y todo'
export const SERVER_URL = process.env.PUBLIC_SERVER_URL || 'http://localhost:3000'
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;


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




export const STORES = {
   'Shivan Shop': {
    storeId: 'shivanshop',
    storeName: 'Shivan Shop Sucursal Centro',
    address: {
      fullName: 'Sucursal Centro',
      streetName: 'Av. Siempre Viva 742',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '01000',
      country: 'México',
      phone: '555-123-4567',
      notes: 'Favor de acudir con identificación. Atención de 9am a 6pm.',
    }
  },
  'Goma Shop': {
    storeId: 'gomaShop',
    storeName: 'Shivan Shop Sucursal Sur',
    storeAddress: 'Calle del Sol 456, Gustavo A. Madero, CDMX',
      fullName: 'Sucursal Norte',
      country: 'México',
      postalCode: '07200',
      streetName: 'Calle del Sol 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      phone: '555-987-6543',
      notes: 'Acceso por puerta lateral. Atención de 10am a 7pm.',
    
  },
  // Add more stores as needed
};
