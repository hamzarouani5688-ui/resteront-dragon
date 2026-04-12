
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'kung-pao-chicken',
    name: 'Kung Pao Chicken',
    price: 19.50,
    description: 'Diced chicken with peanuts, chili peppers, and scallions in a spicy savory sauce.',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&q=80&w=800',
    category: 'Poultry',
    isPopular: true,
    spiciness: 2,
    meta: 'Contains Peanuts'
  },
  {
    id: 'spring-rolls',
    name: 'Spring Rolls (4pcs)',
    price: 8.50,
    description: 'Crispy golden wrappers filled with fresh cabbage, carrots, and glass noodles.',
    image: 'https://images.unsplash.com/photo-1544333346-6472718872f7?auto=format&fit=crop&q=80&w=1200',
    category: 'Starters',
    isVeg: true
  },
  {
    id: 'mongolian-beef',
    name: 'Mongolian Beef',
    price: 21.00,
    description: 'Tender slices of beef wok-seared with scallions and garlic in a rich savory brown sauce.',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800',
    category: 'Beef & Lamb',
    isChefSpecial: true,
    spiciness: 1
  },
  {
    id: 'szechuan-dumplings',
    name: 'Szechuan Dumplings',
    price: 12.00,
    description: 'Steamed pork dumplings bathed in our house-made aromatic chili oil and vinegar.',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800',
    category: 'Dim Sum',
    spiciness: 3
  },
  {
    id: 'peking-duck',
    name: 'Peking Duck',
    price: 45.00,
    description: 'Roasted duck with crispy skin, served with thin pancakes, scallions, and hoisin sauce.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=800',
    category: 'Poultry',
    meta: 'Half Duck'
  },
  {
    id: 'mapo-tofu',
    name: 'Mapo Tofu',
    price: 14.00,
    description: 'Silken tofu set in a spicy chili-bean sauce with minced beef and fermented beans.',
    image: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&q=80&w=800',
    category: 'Starters',
    isNew: true,
    spiciness: 2
  },
  {
    id: 'jasmine-tea',
    name: 'Jasmine Tea',
    price: 3.50,
    description: 'Fragrant jasmine tea brewed to perfection.',
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=800',
    category: 'Drinks'
  },
  {
    id: 'wonton-soup',
    name: 'Wonton Soup',
    price: 7.50,
    description: 'Clear broth with pork wontons and fresh bok choy.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800',
    category: 'Soups'
  },
  {
    id: 'chow-mein',
    name: 'Vegetable Chow Mein',
    price: 15.50,
    description: 'Stir-fried wheat noodles with crisp seasonal vegetables.',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800',
    category: 'Rice & Noodles',
    isVeg: true
  }
];

export const TAX_RATE = 0.08;
export const SERVICE_FEE = 2.08;
