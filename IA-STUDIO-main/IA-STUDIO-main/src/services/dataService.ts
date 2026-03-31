import { Product, ArtistInfo } from '../types';
import { PRODUCTS, GALLERY_IMAGES } from '../constants';

// Natalia only needs to:
// 1. Create a Google Sheet
// 2. File > Share > Publish to web
// 3. Select "Comma-separated values (.csv)"
// 4. Paste the URL here or in an environment variable
const SHEET_CSV_URL = (import.meta as any).env?.VITE_SHEET_URL || '';

export interface GalleryImage {
  url: string;
  title: string;
}

export const fetchRemoteData = async () => {
  if (!SHEET_CSV_URL) {
    return { products: PRODUCTS, gallery: GALLERY_IMAGES };
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();
    
    // Simple CSV parser (assuming standard format)
    const rows = csvText.split('\n').map(row => row.split(','));
    
    const products: Product[] = [];
    const gallery: GalleryImage[] = [];
    
    // Logic to parse different sections based on headers
    // For simplicity, we'll assume a specific structure in the sheet
    // Row 0: Type (Product/Gallery), Name/URL, Price/Title, Image, Description, Category
    
    rows.slice(1).forEach(row => {
      const type = row[0]?.trim();
      if (type === 'Product') {
        products.push({
          id: Math.random().toString(36).substr(2, 9),
          name: row[1]?.trim(),
          price: parseInt(row[2]?.trim()) || 0,
          image: row[3]?.trim(),
          description: row[4]?.trim(),
          category: (row[5]?.trim() as any) || 'Other'
        });
      } else if (type === 'Gallery') {
        gallery.push({
          url: row[1]?.trim(),
          title: row[2]?.trim()
        });
      }
    });

    return { 
      products: products.length > 0 ? products : PRODUCTS, 
      gallery: gallery.length > 0 ? gallery : GALLERY_IMAGES 
    };
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    return { products: PRODUCTS, gallery: GALLERY_IMAGES };
  }
};
