export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: 'Ear' | 'Nose' | 'Lip' | 'Other';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ArtistInfo {
  name: string;
  alias: string;
  location: string;
  whatsapp: string;
  instagram: string;
  specialty: string;
  bio: string;
}
