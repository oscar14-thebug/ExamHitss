import type { PlpProduct } from '../../src/types/api.types';

// Catálogo mock para el modo mockeado: 3 franquicias (PlayStation 5, Xbox
// Series X, Nintendo Switch), 8 productos cada una, 7 de ellas con "Blanco"
// entre sus colores (una variante queda deliberadamente fuera del color
// "Blanco" por franquicia, para probar que el filtro de color realmente
// excluye algo). Esto deja >= 5 resultados tras búsqueda + filtro "Blanco"
// para cada uno de los 3 términos parametrizados en el spec, como pide el
// reto. Usado por mock-liverpool-site.ts para servir /api/plp/search.
export const mockProducts: PlpProduct[] = [
  // --- PlayStation 5 ---
  { id: 'p1', name: 'Consola PlayStation 5 Standard Edition', price: { price: 12999 }, colors: ['Blanco'] },
  { id: 'p2', name: 'Consola PlayStation 5 Digital Edition', price: { price: 10999 }, colors: ['Blanco'] },
  { id: 'p3', name: 'Control inalámbrico DualSense para PlayStation 5', price: { price: 1499 }, colors: ['Blanco', 'Negro'] },
  { id: 'p4', name: 'Control inalámbrico DualSense para PlayStation 5 Midnight Black', price: { price: 1499 }, colors: ['Negro'] },
  { id: 'p5', name: 'Base de carga DualSense PlayStation 5', price: { price: 799 }, colors: ['Blanco'] },
  { id: 'p6', name: 'Auriculares inalámbricos Pulse 3D PlayStation 5', price: { price: 1999 }, colors: ['Blanco', 'Negro'] },
  { id: 'p7', name: 'Funda protectora para consola PlayStation 5', price: { price: 699 }, colors: ['Blanco'] },
  { id: 'p8', name: 'Cámara HD para PlayStation 5', price: { price: 1299 }, colors: ['Blanco'] },

  // --- Xbox Series X ---
  { id: 'p9', name: 'Consola Xbox Series X 1TB', price: { price: 11999 }, colors: ['Blanco'] },
  { id: 'p10', name: 'Consola Xbox Series X Digital Edition', price: { price: 9999 }, colors: ['Blanco'] },
  { id: 'p11', name: 'Control inalámbrico para Xbox Series X', price: { price: 1299 }, colors: ['Blanco', 'Negro'] },
  { id: 'p12', name: 'Control inalámbrico para Xbox Series X Carbon Black', price: { price: 1299 }, colors: ['Negro'] },
  { id: 'p13', name: 'Base de carga para control Xbox Series X', price: { price: 599 }, colors: ['Blanco'] },
  { id: 'p14', name: 'Auriculares inalámbricos para Xbox Series X', price: { price: 1799 }, colors: ['Blanco', 'Negro'] },
  { id: 'p15', name: 'Funda protectora para consola Xbox Series X', price: { price: 649 }, colors: ['Blanco'] },
  { id: 'p16', name: 'Cámara HD para Xbox Series X', price: { price: 1099 }, colors: ['Blanco'] },

  // --- Nintendo Switch ---
  { id: 'p17', name: 'Consola Nintendo Switch OLED', price: { price: 8999 }, colors: ['Blanco'] },
  { id: 'p18', name: 'Consola Nintendo Switch Standard', price: { price: 6999 }, colors: ['Blanco'] },
  { id: 'p19', name: 'Joy-Con para Nintendo Switch (par)', price: { price: 1899 }, colors: ['Blanco', 'Negro'] },
  { id: 'p20', name: 'Joy-Con para Nintendo Switch Edición Neón', price: { price: 1899 }, colors: ['Rojo', 'Azul'] },
  { id: 'p21', name: 'Base de carga para Nintendo Switch', price: { price: 699 }, colors: ['Blanco'] },
  { id: 'p22', name: 'Auriculares inalámbricos para Nintendo Switch', price: { price: 1299 }, colors: ['Blanco', 'Negro'] },
  { id: 'p23', name: 'Funda protectora para consola Nintendo Switch', price: { price: 549 }, colors: ['Blanco'] },
  { id: 'p24', name: 'Cámara HD para Nintendo Switch', price: { price: 899 }, colors: ['Blanco'] },
];
