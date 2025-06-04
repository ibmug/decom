export const APP_NAME = process.env.PUBLIC_APP_NAME || 'Tiendita';
export const APP_DESCRIPTION =  process.env.PUBLIC_DESCRIPTION || 'Una tiendita'
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


export const USER_ROLES = process.env.USER_ROLES ? process.env.USER_ROLES.split(', ') : ['admin', 'user', 'manager'] 



export const STORES = {
   'Shivan Shop': {
    storeId: 'shivanshop',
    addressName: 'Shivan Shop Sucursal Centro',
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
    addressName: 'Shivan Shop Sucursal Sur',
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

export const SET_CODES = [
  { code: 'khm', name: 'Kaldheim' },
  { code: 'neo', name: 'Kamigawa: Neon Dynasty' },
  { code: 'one', name: 'Phyrexia: All Will Be One' },
  { code: 'mom', name: 'March of the Machine' },
  { code: 'bro', name: 'The Brothers’ War' },
  { code: 'snc', name: 'Streets of New Capenna' },
  { code: 'mid', name: 'Innistrad: Midnight Hunt' },
  { code: 'vow', name: 'Innistrad: Crimson Vow' },
  { code: 'afr', name: 'Adventures in the Forgotten Realms' },
  { code: 'sld', name: 'Secret Lair Drop' },
  { code: '5ed', name: 'Fifth Edition' },
  { code: 'uma', name: 'Ultimate Masters' },
  { code: 'mh2', name: 'Modern Horizons 2' },
  { code: 'war', name: 'War of the Spark' },
  { code: 'grn', name: 'Guilds of Ravnica' },
  { code: 'dom', name: 'Dominaria' },
  { code: 'znr', name: 'Zendikar Rising' },
  { code: 'm21', name: 'Core Set 2021' },
  { code: 'eld', name: 'Throne of Eldraine' },
  { code: 'thb', name: 'Theros Beyond Death' },
  { code: 'iko', name: 'Ikoria: Lair of Behemoths' },
  { code: 'stx', name: 'Strixhaven: School of Mages' },
  { code: 'dmu', name: 'Dominaria United' },
  { code: 'mat', name: 'March of the Machine: The Aftermath' },
  { code: 'ltr', name: 'The Lord of the Rings: Tales of Middle-earth' },
  { code: 'woe', name: 'Wilds of Eldraine' },
  { code: 'lci', name: 'The Lost Caverns of Ixalan' },
  { code: 'mkm', name: 'Murders at Karlov Manor' },
  { code: 'otj', name: 'Outlaws of Thunder Junction' },
  { code: 'mh3', name: 'Modern Horizons 3' },
  { code: 'acr', name: 'Assassin’s Creed' },
  { code: 'blb', name: 'Bloomburrow' },
  { code: 'dsk', name: 'Duskmourn: House of Horror' },
  { code: 'fdn', name: 'Foundations' },
  { code: 'dfn', name: 'Foundations Jumpstart' },
  { code: 'inr', name: 'Innistrad Remastered' },
  { code: 'dft', name: 'Aetherdrift' },
  { code: 'tdm', name: 'Tarkir: Dragonstorm' },
  { code: 'fin', name: 'Final Fantasy' },
  { code: 'eoe', name: 'Edge of Eternities' },
  { code: 'spm', name: 'Marvel’s Spider-Man' },
  { code: 'ava', name: 'Avatar: The Last Airbender' },
  // ... add more as needed
]



export const CARD_COLORS = [
  {code:'B', name:"Black"},
  {code:'W', name:"White"},
  {code:'G', name:"Green"},
  {code:'U', name:"Blue"},
  {code:'R', name:"Red"},
  {code:'', name:"Colorless"},
]
export const CARD_TYPES = [
  'Creature',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
  'Instant',
  'Sorcery',
  'Battle',
]