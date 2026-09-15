import type { PlpProduct } from '../../src/types/api.types';

// Catálogo temático "playstation 5" — 8 productos, precios variados, 7 de
// ellos con "Blanco" entre sus colores (solo el control Midnight Black
// queda fuera) para que buscar "playstation 5" + filtrar color "Blanco"
// deje >= 5 resultados, como pide el reto. Usado por mock-liverpool-site.ts
// para servir /api/plp/search en modo mockeado.
export const mockProducts: PlpProduct[] = [
  { id: 'p1', name: 'Consola PlayStation 5 Standard Edition', price: { price: 12999 }, colors: ['Blanco'] },
  { id: 'p2', name: 'Consola PlayStation 5 Digital Edition', price: { price: 10999 }, colors: ['Blanco'] },
  { id: 'p3', name: 'Control inalámbrico DualSense para PlayStation 5', price: { price: 1499 }, colors: ['Blanco', 'Negro'] },
  { id: 'p4', name: 'Control inalámbrico DualSense para PlayStation 5 Midnight Black', price: { price: 1499 }, colors: ['Negro'] },
  { id: 'p5', name: 'Base de carga DualSense PlayStation 5', price: { price: 799 }, colors: ['Blanco'] },
  { id: 'p6', name: 'Auriculares inalámbricos Pulse 3D PlayStation 5', price: { price: 1999 }, colors: ['Blanco', 'Negro'] },
  { id: 'p7', name: 'Funda protectora para consola PlayStation 5', price: { price: 699 }, colors: ['Blanco'] },
  { id: 'p8', name: 'Cámara HD para PlayStation 5', price: { price: 1299 }, colors: ['Blanco'] },
];
