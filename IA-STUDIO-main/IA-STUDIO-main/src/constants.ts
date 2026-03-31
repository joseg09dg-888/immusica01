import { ArtistInfo, Product } from './types';

export const ARTIST_INFO: ArtistInfo = {
  name: "Natalia Cruz Duran",
  alias: "Nath Piercer",
  location: "Neiva - Huila, Colombia",
  whatsapp: "573000000000", // Placeholder, user should update
  instagram: "nath_piercer",
  specialty: "Perforaciones profesionales con joyería de Titanio G23",
  bio: "Especialista en perforaciones corporales con altos estándares de higiene y bioseguridad. Solo utilizo joyería de titanio de grado implante para garantizar la mejor cicatrización y salud de tu piel."
};

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Nostril L-Shape Titanium',
    price: 35000,
    image: 'https://picsum.photos/seed/piercing1/400/400',
    description: 'Joya básica para nariz en titanio grado implante.',
    category: 'Nose'
  },
  {
    id: '2',
    name: 'Helix Ring Titanium',
    price: 45000,
    image: 'https://picsum.photos/seed/piercing2/400/400',
    description: 'Aro de titanio para hélix, disponible en varios diámetros.',
    category: 'Ear'
  },
  {
    id: '3',
    name: 'Septum Clicker Titanium',
    price: 60000,
    image: 'https://picsum.photos/seed/piercing3/400/400',
    description: 'Clicker de titanio con diseño minimalista.',
    category: 'Nose'
  },
  {
    id: '4',
    name: 'Labret Flat Back Titanium',
    price: 40000,
    image: 'https://picsum.photos/seed/piercing4/400/400',
    description: 'Labret con base plana para mayor comodidad.',
    category: 'Lip'
  },
  {
    id: '5',
    name: 'Industrial Bar Titanium',
    price: 75000,
    image: 'https://picsum.photos/seed/piercing5/400/400',
    description: 'Barra industrial de titanio pulido a espejo.',
    category: 'Ear'
  },
  {
    id: '6',
    name: 'Daith Heart Titanium',
    price: 55000,
    image: 'https://picsum.photos/seed/piercing6/400/400',
    description: 'Joya en forma de corazón para daith.',
    category: 'Ear'
  }
];

export const GALLERY_IMAGES = [
  { url: 'https://picsum.photos/seed/work1/600/800', title: 'Helix Piercing' },
  { url: 'https://picsum.photos/seed/work2/600/800', title: 'Nostril Piercing' },
  { url: 'https://picsum.photos/seed/work3/600/800', title: 'Septum Piercing' },
  { url: 'https://picsum.photos/seed/work4/600/800', title: 'Tragus Piercing' },
  { url: 'https://picsum.photos/seed/work5/600/800', title: 'Industrial Piercing' },
  { url: 'https://picsum.photos/seed/work6/600/800', title: 'Conch Piercing' },
];
