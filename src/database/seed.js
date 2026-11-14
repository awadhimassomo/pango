// Sample data. Videos and 3D models point at public sample assets so the demo works out of the box.
// Replace them by uploading your own via POST /api/houses/:id/media.
const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const KHRONOS = 'https://modelviewer.dev/shared-assets/models';

const now = new Date().toISOString();

module.exports = [
  {
    id: 'h1',
    title: 'Modern Family Villa with Pool',
    description: 'Bright 4-bedroom villa with open-plan living, a private pool and a landscaped garden. Five minutes from international schools.',
    price: 650000, type: 'villa', listingType: 'sale', bedrooms: 4, bathrooms: 3, areaSqm: 320,
    city: 'Nairobi', address: '12 Karen Road', lat: -1.3197, lng: 36.7076,
    amenities: ['pool', 'garden', 'parking', 'security'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200'],
    videos: [{ url: VIDEO, title: 'Walkthrough' }],
    models3d: [{ url: `${KHRONOS}/Astronaut.glb`, title: '3D view (demo model)' }],
    createdAt: now,
  },
  {
    id: 'h2',
    title: 'Cozy City Apartment',
    description: 'Renovated 2-bedroom apartment in the city centre, walking distance to cafes and public transport.',
    price: 1400, type: 'apartment', listingType: 'rent', bedrooms: 2, bathrooms: 1, areaSqm: 78,
    city: 'Lagos', address: '5 Marina Street', lat: 6.4541, lng: 3.3947,
    amenities: ['elevator', 'wifi', 'parking'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'],
    videos: [{ url: VIDEO, title: 'Apartment tour' }],
    models3d: [],
    createdAt: now,
  },
  {
    id: 'h3',
    title: 'Charming Bungalow near the Park',
    description: 'Single-storey 3-bedroom bungalow with a sunny veranda and a large fenced garden. Perfect for families with pets.',
    price: 285000, type: 'house', listingType: 'sale', bedrooms: 3, bathrooms: 2, areaSqm: 160,
    city: 'Accra', address: '8 Park Lane', lat: 5.6037, lng: -0.187,
    amenities: ['garden', 'parking', 'pet-friendly'],
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200'],
    videos: [],
    models3d: [{ url: `${KHRONOS}/shishkebab.glb`, title: '3D view (demo model)' }],
    createdAt: now,
  },
  {
    id: 'h4',
    title: 'Luxury Penthouse with Skyline View',
    description: 'Top-floor 3-bedroom penthouse with floor-to-ceiling windows, private terrace, gym and concierge.',
    price: 1250000, type: 'apartment', listingType: 'sale', bedrooms: 3, bathrooms: 3, areaSqm: 240,
    city: 'Nairobi', address: '1 Upper Hill Tower', lat: -1.2993, lng: 36.8148,
    amenities: ['gym', 'elevator', 'security', 'terrace', 'parking'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'],
    videos: [{ url: VIDEO, title: 'Penthouse tour' }],
    models3d: [{ url: `${KHRONOS}/Astronaut.glb`, title: '3D view (demo model)' }],
    createdAt: now,
  },
  {
    id: 'h5',
    title: 'Affordable Studio for Students',
    description: 'Compact furnished studio close to the university with fast wifi and utilities included.',
    price: 450, type: 'studio', listingType: 'rent', bedrooms: 1, bathrooms: 1, areaSqm: 32,
    city: 'Accra', address: '22 Campus Road', lat: 5.65, lng: -0.18,
    amenities: ['wifi', 'furnished'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200'],
    videos: [],
    models3d: [],
    createdAt: now,
  },
];
