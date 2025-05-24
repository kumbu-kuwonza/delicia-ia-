import { Product, Category, Promotion } from '@/types';

export const categories: Category[] = [
  { id: 'main-dishes', name: 'Pratos Principais' },
  { id: 'burgers', name: 'Hamburgers' },
  { id: 'sides', name: 'Acompanhamentos' },
  { id: 'drinks', name: 'Bebidas' },
  { id: 'desserts', name: 'Sobremesas' },
  { id: 'pizzas', name: 'Pizzas' },
  { id: 'japanese', name: 'Comida Japonesa' },
  { id: 'salads', name: 'Saladas' },
  { id: 'seafood', name: 'Frutos do Mar' },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'Feijoada Completa',
    description: 'Nossa tradicional feijoada com arroz, couve, farofa e laranja',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1525518392674-39ba1feb3d75?w=800&q=70&fit=crop',
    category: 'main-dishes',
    prepTime: 20,
    available: true,
    featured: true
  },
  {
    id: 2,
    name: 'Picanha na Brasa',
    description: 'Picanha grelhada com arroz, feijão e vinagrete',
    price: 58.90,
    image: 'https://images.unsplash.com/photo-1594041680539-8754f1d71398?w=800&q=70&fit=crop',
    category: 'main-dishes',
    prepTime: 25,
    available: true
  },
  {
    id: 3,
    name: 'Hambúrguer Clássico',
    description: 'Hambúrguer artesanal com queijo, alface, tomate e cebola',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=70&fit=crop',
    category: 'burgers',
    prepTime: 15,
    available: true
  },
  {
    id: 4,
    name: 'Hambúrguer Especial',
    description: 'Hambúrguer artesanal com queijo cheddar, bacon, molho especial e cebola caramelizada',
    price: 38.90,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=70&fit=crop',
    category: 'burgers',
    prepTime: 18,
    available: true,
    featured: true
  },
  {
    id: 5,
    name: 'Batata Frita',
    description: 'Porção de batatas fritas crocantes',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&q=70&fit=crop',
    category: 'sides',
    prepTime: 10,
    available: true
  },
  {
    id: 6,
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=70&fit=crop',
    category: 'sides',
    prepTime: 12,
    available: true
  },
  {
    id: 7,
    name: 'Refrigerante',
    description: 'Lata 350ml (Coca-Cola, Guaraná, Sprite)',
    price: 6.90,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=70&fit=crop',
    category: 'drinks',
    prepTime: 2,
    available: true
  },
  {
    id: 8,
    name: 'Suco Natural',
    description: 'Copo 300ml (Laranja, Limão, Abacaxi)',
    price: 9.90,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=70&fit=crop',
    category: 'drinks',
    prepTime: 5,
    available: true
  },
  {
    id: 9,
    name: 'Pudim de Leite',
    description: 'Pudim de leite condensado tradicional',
    price: 15.90,
    image: 'https://images.unsplash.com/photo-1552691562-ca797c8a3c27?w=800&q=70&fit=crop',
    category: 'desserts',
    prepTime: 5,
    available: true
  },
  {
    id: 10,
    name: 'Mousse de Chocolate',
    description: 'Mousse de chocolate cremoso com raspas de chocolate',
    price: 17.90,
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&q=70&fit=crop',
    category: 'desserts',
    prepTime: 5,
    available: true
  },
  {
    id: 11,
    name: "Pizza Margherita",
    description: "Clássica pizza italiana com molho de tomate, mozzarella e manjericão fresco.",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=800&q=70&fit=crop",
    category: "pizzas",
    prepTime: 18,
    available: true,
    featured: true
  },
  {
    id: 12,
    name: "Pizza Calabresa",
    description: "Feita com molho de tomate, queijo, fatias de calabresa e cebola.",
    price: 48.90,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70&fit=crop",
    category: "pizzas",
    prepTime: 20,
    available: true
  },
  {
    id: 13,
    name: "Cheeseburger Duplo",
    description: "Dois burgers artesanais, queijo cheddar em dobro, alface, tomate.",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&q=70&fit=crop",
    category: "burgers",
    prepTime: 16,
    available: true
  },
  {
    id: 14,
    name: "Sushi Especial",
    description: "Combo de sushi variado (8 peças), incluindo salmão e atum.",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=70&fit=crop",
    category: "japanese",
    prepTime: 14,
    available: true
  },
  {
    id: 15,
    name: "Cerveja Artesanal",
    description: "Long neck de 355ml, várias opções (consulte o garçom).",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=70&fit=crop",
    category: "drinks",
    prepTime: 1,
    available: true
  },
  {
    id: 16,
    name: "Sorvete Artesanal",
    description: "Porção com 2 bolas. Sabores: chocolate, morango ou creme.",
    price: 14.90,
    image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&q=70&fit=crop",
    category: "desserts",
    prepTime: 2,
    available: true
  },
  {
    id: 17,
    name: "Sashimi de Salmão",
    description: "Fatias frescas de salmão servidas com molho shoyu.",
    price: 32.90,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=70&fit=crop",
    category: "japanese",
    prepTime: 10,
    available: true
  },
  {
    id: 18,
    name: "Temaki de Atum",
    description: "Cone de alga recheado com atum fresco, arroz e cream cheese.",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&q=70&fit=crop",
    category: "japanese",
    prepTime: 8,
    available: true
  },
  {
    id: 19,
    name: "Camarão na Moranga",
    description: "Camarões flambados com conhaque em um creme de abóbora.",
    price: 68.90,
    image: "https://images.unsplash.com/photo-1565299715199-866c917206bb?w=800&q=70&fit=crop",
    category: "seafood",
    prepTime: 30,
    available: true
  },
  {
    id: 20,
    name: "Salada Caesar",
    description: "Mix de folhas, croutons, parmesão e molho Caesar.",
    price: 26.90,
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800&q=70&fit=crop",
    category: "salads",
    prepTime: 10,
    available: true
  },
  {
    id: 21,
    name: "Pizza Quatro Queijos",
    description: "Molho de tomate e uma combinação de mussarela, provolone, gorgonzola e parmesão.",
    price: 52.90,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=70&fit=crop",
    category: "pizzas",
    prepTime: 20,
    available: true
  },
  {
    id: 22,
    name: "Moqueca de Peixe",
    description: "Peixe cozido em molho de leite de coco, pimentões, tomate e coentro.",
    price: 62.90,
    image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=70&fit=crop",
    category: "seafood",
    prepTime: 35,
    available: true
  },
  {
    id: 23,
    name: "Salada Caprese",
    description: "Tomate, mussarela de búfala, manjericão fresco e azeite extra virgem.",
    price: 28.90,
    image: "https://images.unsplash.com/photo-1608032364895-84e3d7975ee3?w=800&q=70&fit=crop",
    category: "salads",
    prepTime: 8,
    available: true
  },
  {
    id: 24,
    name: "Limonada Suíça",
    description: "Limão siciliano batido com leite condensado e gelo.",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=70&fit=crop",
    category: "drinks",
    prepTime: 5,
    available: true
  },
  {
    id: 25,
    name: "Pudim de Maracujá",
    description: "Pudim cremoso com calda de maracujá fresco.",
    price: 16.90,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=70&fit=crop",
    category: "desserts",
    prepTime: 5,
    available: false
  }
];

// Criar os dados para o carousel de promoções (serão movidos para outro arquivo)
export const promotions: Promotion[] = [
  {
    id: 1,
    title: "Oferta Especial",
    description: "Compre um combo e ganhe uma sobremesa!",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    badgeText: "HOJE",
    buttonText: "Ver Oferta",
    url: "/promocoes/combo-sobremesa"
  },
  {
    id: 2,
    title: "Evento Gastronômico",
    description: "Música ao vivo neste fim de semana!",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    badgeText: "EVENTO",
    buttonText: "Saiba Mais",
    url: "/eventos/musica-ao-vivo"
  },
  {
    id: 3,
    title: "Nova Bebida",
    description: "Experimente nosso novo smoothie de frutas!",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    badgeText: "NOVO",
    buttonText: "Experimentar",
    url: "/bebidas/smoothie-frutas"
  },
  {
    id: 4,
    title: "Terça de Massas",
    description: "Todas as massas com 20% de desconto!",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    badgeText: "DESCONTO",
    buttonText: "Ver Menu",
    url: "/promocoes/terca-massas"
  },
  {
    id: 5,
    title: "Happy Hour",
    description: "Chopp em dobro das 18h às 20h!",
    image: "https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    badgeText: "HAPPY HOUR",
    buttonText: "Veja o Cardápio",
    url: "/promocoes/happy-hour"
  }
];

export const mockOrders = [
  {
    id: '1',
    items: [
      { product: products[0], quantity: 2 },
      { product: products[6], quantity: 3 },
    ],
    customer: {
      id: '1',
      name: 'João Silva',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123',
      points: 150,
    },
    total: 102.50,
    pointsUsed: 0,
    pointsEarned: 10,
    status: 'new',
    createdAt: new Date('2023-04-22T14:30:00'),
    updatedAt: new Date('2023-04-22T14:30:00'),
  },
  {
    id: '2',
    items: [
      { product: products[3], quantity: 1 },
      { product: products[5], quantity: 1 },
      { product: products[7], quantity: 2 },
    ],
    customer: {
      id: '2',
      name: 'Maria Oliveira',
      phone: '(11) 91234-5678',
      address: 'Av. Paulista, 1000',
      points: 220,
    },
    total: 81.60,
    pointsUsed: 0,
    pointsEarned: 8,
    status: 'preparing',
    createdAt: new Date('2023-04-22T14:15:00'),
    updatedAt: new Date('2023-04-22T14:20:00'),
  },
];

export const mockStats = {
  totalOrders: 156,
  totalRevenue: 8750.45,
  averageOrderValue: 56.09,
  popularItems: [
    { name: 'Hambúrguer Especial', count: 42 },
    { name: 'Feijoada Completa', count: 38 },
    { name: 'Refrigerante', count: 95 },
    { name: 'Batata Frita', count: 67 },
  ],
  recentOrders: mockOrders
};
