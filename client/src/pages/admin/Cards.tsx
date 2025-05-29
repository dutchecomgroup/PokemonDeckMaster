import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  MoreHorizontal, 
  Eye, 
  Plus, 
  FileUp, 
  Pencil, 
  Trash2, 
  ImageIcon,
  Calendar, 
  Sparkles
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Types
interface Card {
  id: string;
  name: string;
  supertype?: string;
  type?: string;
  rarity?: string;
  set?: string;
  setCode?: string;
  setName?: string;
  number?: string;
  images?: {
    small?: string;
    large?: string;
  };
  imageUrl?: string;
  collectionCount?: number;
  artist?: string;
  hp?: string;
  flavorText?: string;
  price?: number;
  releaseDate?: string;
  abilities?: Array<{
    name: string;
    text: string;
    type: string;
  }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
}

interface Set {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate?: string;
  updatedAt?: string;
  images?: {
    symbol?: string;
    logo?: string;
  };
  description?: string;
}

// Zod schemas for form validation
const setFormSchema = z.object({
  name: z.string().min(1, "Set name is required"),
  series: z.string().min(1, "Series is required"),
  releaseDate: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  symbolUrl: z.string().optional(),
});

const cardFormSchema = z.object({
  name: z.string().min(1, "Card name is required"),
  setId: z.string().min(1, "Set is required"),
  supertype: z.string().min(1, "Supertype is required"),
  type: z.string().min(1, "Type is required"),
  rarity: z.string().min(1, "Rarity is required"),
  number: z.string().min(1, "Number is required"),
  artist: z.string().optional(),
  hp: z.string().optional(),
  flavorText: z.string().optional(),
  imageUrl: z.string().optional(),
});

const CardsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cards");
  
  // Cards state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  
  // Sets state
  const [isAddSetDialogOpen, setIsAddSetDialogOpen] = useState(false);
  const [selectedSetDetails, setSelectedSetDetails] = useState<Set | null>(null);
  const [isEditSetDialogOpen, setIsEditSetDialogOpen] = useState(false);
  const [isDeleteSetDialogOpen, setIsDeleteSetDialogOpen] = useState(false);

  // Forms
  const setForm = useForm<z.infer<typeof setFormSchema>>({
    resolver: zodResolver(setFormSchema),
    defaultValues: {
      name: "",
      series: "",
      releaseDate: "",
      description: "",
      logoUrl: "",
      symbolUrl: "",
    },
  });

  const cardForm = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: "",
      setId: "",
      supertype: "Pokémon",
      type: "",
      rarity: "",
      number: "",
      artist: "",
      hp: "",
      flavorText: "",
      imageUrl: "",
    },
  });

  // Queries
  const { data: cards = [], isLoading: isCardsLoading } = useQuery({
    queryKey: ['/api/admin/cards'],
    queryFn: async () => {
      try {
        // In a real implementation this would fetch from the server
        const res = await fetch('/api/admin/cards');
        if (!res.ok) throw new Error('Failed to fetch cards');
        return await res.json();
      } catch (error) {
        console.error('Error fetching cards:', error);
        
        // For demonstration purposes we use example data with a more comprehensive list
        // This is just sample data - in a real system, it would come from the API
        return [
          {
            id: 'swsh12-1',
            name: 'Venusaur V',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Ultra Rare',
            set: { id: 'swsh12', name: 'Silver Tempest' },
            number: '1',
            images: { small: 'https://images.pokemontcg.io/swsh12/1.png' },
            collectionCount: 15,
            artist: "Mitsuhiro Arita",
            hp: "220",
            flavorText: "When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs."
          },
          {
            id: 'swsh12-25',
            name: 'Charizard',
            supertype: 'Pokémon',
            type: 'Fire',
            rarity: 'Rare Holo',
            set: { id: 'swsh12', name: 'Silver Tempest' },
            number: '25',
            images: { small: 'https://images.pokemontcg.io/swsh12/25.png' },
            collectionCount: 42,
            artist: "Akira Egawa",
            hp: "170",
            flavorText: "It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames."
          },
          {
            id: 'sv1-1',
            name: 'Sprigatito',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Common',
            set: { id: 'sv1', name: 'Scarlet & Violet' },
            number: '1',
            images: { small: 'https://images.pokemontcg.io/sv1/1.png' },
            collectionCount: 28,
            artist: "Yuka Morii",
            hp: "70",
            flavorText: "The sweet scent its body gives off mesmerizes those around it. The scent grows stronger when this Pokémon bathes in sunlight."
          },
          {
            id: 'sv1-28',
            name: 'Pikachu',
            supertype: 'Pokémon',
            type: 'Lightning',
            rarity: 'Common',
            set: { id: 'sv1', name: 'Scarlet & Violet' },
            number: '28',
            images: { small: 'https://images.pokemontcg.io/sv1/28.png' },
            collectionCount: 65,
            artist: "Atsuko Nishida",
            hp: "60",
            flavorText: "When Pikachu meet, they'll touch their tails together and exchange electricity through them as a form of greeting."
          },
          {
            id: 'sv2-17',
            name: 'Jigglypuff',
            supertype: 'Pokémon',
            type: 'Fairy',
            rarity: 'Common',
            set: { id: 'sv2', name: 'Paldea Evolved' },
            number: '17',
            images: { small: 'https://images.pokemontcg.io/swsh10/132.png' },
            collectionCount: 18,
            artist: "Miki Tanaka",
            hp: "70",
            flavorText: "Jigglypuff's vocal cords can freely adjust the wavelength of its voice. This Pokémon uses this ability to sing at precisely the right wavelength to make its foes most drowsy."
          },
          {
            id: 'sv2-83',
            name: 'Mewtwo ex',
            supertype: 'Pokémon',
            type: 'Psychic',
            rarity: 'Rare Holo',
            set: { id: 'sv2', name: 'Paldea Evolved' },
            number: '83',
            images: { small: 'https://images.pokemontcg.io/sv2/83.png' },
            collectionCount: 31,
            artist: "5ban Graphics",
            hp: "200",
            flavorText: "A Pokémon created by recombining Mew's genes. It's said to have the most savage heart among Pokémon."
          },
          {
            id: 'sv3-93',
            name: 'Gardevoir ex',
            supertype: 'Pokémon',
            type: 'Psychic',
            rarity: 'Rare Ultra',
            set: { id: 'sv3', name: 'Obsidian Flames' },
            number: '93',
            images: { small: 'https://images.pokemontcg.io/sv3/93.png' },
            collectionCount: 22,
            artist: "Kawayoo",
            hp: "230",
            flavorText: "It has the power to predict the future. Its power peaks when it is protecting its Trainer."
          },
          {
            id: 'sv3-129',
            name: 'Charizard ex',
            supertype: 'Pokémon',
            type: 'Fire',
            rarity: 'Rare Rainbow',
            set: { id: 'sv3', name: 'Obsidian Flames' },
            number: '129',
            images: { small: 'https://images.pokemontcg.io/sv3/129.png' },
            collectionCount: 47,
            artist: "Akira Komayama",
            hp: "330",
            flavorText: "Its wings can carry this Pokémon close to an altitude of 4,600 feet. It blows out fire of such great heat that it melts anything."
          },
          {
            id: 'sve-106',
            name: 'Mew ex',
            supertype: 'Pokémon',
            type: 'Psychic',
            rarity: 'Rare Holo',
            set: { id: 'sve', name: 'Scarlet & Violet—Evolving Powers' },
            number: '106',
            images: { small: 'https://images.pokemontcg.io/sve/106.png' },
            collectionCount: 29,
            artist: "Akira Egawa",
            hp: "190",
            flavorText: "When viewed through a microscope, this Pokémon's short, fine, delicate hair can be seen."
          },
          {
            id: 'sve-177',
            name: 'Mimikyu ex',
            supertype: 'Pokémon',
            type: 'Psychic',
            rarity: 'Rare Ultra',
            set: { id: 'sve', name: 'Scarlet & Violet—Evolving Powers' },
            number: '177',
            images: { small: 'https://images.pokemontcg.io/sve/177.png' },
            collectionCount: 14,
            artist: "Miki Tanaka",
            hp: "170",
            flavorText: "It wears a rag fashioned into a Pikachu costume in an effort to look less scary. Unfortunately, the costume only makes it creepier."
          },
          {
            id: 'sv4pt5-74',
            name: 'Arcanine',
            supertype: 'Pokémon',
            type: 'Fire',
            rarity: 'Rare Holo',
            set: { id: 'sv4pt5', name: 'Temporal Forces' },
            number: '74',
            images: { small: 'https://images.pokemontcg.io/sv4pt5/74.png' },
            collectionCount: 8,
            artist: "Ryuta Fuse",
            hp: "140",
            flavorText: "The sight of it running over 6,200 miles in a single day and night has captivated many people."
          },
          {
            id: 'sv4-186',
            name: 'Chien-Pao ex',
            supertype: 'Pokémon',
            type: 'Water',
            rarity: 'Rare Holo',
            set: { id: 'sv4', name: 'Paradox Rift' },
            number: '186',
            images: { small: 'https://images.pokemontcg.io/sv4/186.png' },
            collectionCount: 11,
            artist: "5ban Graphics",
            hp: "220",
            flavorText: "Chien-Pao manipulates its opponents with its freezing cold and then plunders their belongings."
          },
          {
            id: 'swsh7-17',
            name: 'Bulbasaur',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Common',
            set: { id: 'swsh7', name: 'Evolving Skies' },
            number: '17',
            images: { small: 'https://images.pokemontcg.io/swsh7/17.png' },
            collectionCount: 54,
            artist: "Saya Tsuruta",
            hp: "70",
            flavorText: "There is a plant seed on its back right from the day this Pokémon is born. The seed slowly grows larger."
          },
          {
            id: 'swsh7-25',
            name: 'Leafeon V',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Ultra Rare',
            set: { id: 'swsh7', name: 'Evolving Skies' },
            number: '25',
            images: { small: 'https://images.pokemontcg.io/swsh7/25.png' },
            collectionCount: 38,
            artist: "5ban Graphics",
            hp: "210",
            flavorText: "When the temperature gets too cold, Leafeon leaves its territory to head somewhere warmer. It tucks its grassy body close and avoids moving to conserve its body temperature."
          },
          {
            id: 'swsh7-30',
            name: 'Raichu',
            supertype: 'Pokémon',
            type: 'Lightning',
            rarity: 'Rare',
            set: { id: 'swsh7', name: 'Evolving Skies' },
            number: '30',
            images: { small: 'https://images.pokemontcg.io/swsh7/30.png' },
            collectionCount: 24,
            artist: "Miki Tanaka",
            hp: "120",
            flavorText: "Its long tail serves as a ground to protect itself from its own high-voltage power."
          },
          {
            id: 'swsh6-36',
            name: 'Squirtle',
            supertype: 'Pokémon',
            type: 'Water',
            rarity: 'Common',
            set: { id: 'swsh6', name: 'Chilling Reign' },
            number: '36',
            images: { small: 'https://images.pokemontcg.io/swsh6/36.png' },
            collectionCount: 70,
            artist: "kawayoo",
            hp: "70",
            flavorText: "When it feels threatened, it draws its limbs inside its shell and sprays water from its mouth."
          },
          {
            id: 'swsh6-42',
            name: 'Articuno V',
            supertype: 'Pokémon',
            type: 'Water',
            rarity: 'Ultra Rare',
            set: { id: 'swsh6', name: 'Chilling Reign' },
            number: '42',
            images: { small: 'https://images.pokemontcg.io/swsh6/42.png' },
            collectionCount: 25,
            artist: "5ban Graphics",
            hp: "210",
            flavorText: "It can create blizzards by freezing moisture in the air. This legendary bird Pokémon appears when winter comes."
          },
          {
            id: 'swsh10-23',
            name: 'Flareon',
            supertype: 'Pokémon',
            type: 'Fire',
            rarity: 'Uncommon',
            set: { id: 'swsh10', name: 'Astral Radiance' },
            number: '23',
            images: { small: 'https://images.pokemontcg.io/swsh10/23.png' },
            collectionCount: 19,
            artist: "Saya Tsuruta",
            hp: "130",
            flavorText: "Once it has stored up enough heat, this Pokémon's body temperature can reach up to 1,700 degrees Fahrenheit."
          },
          {
            id: 'swsh10-90',
            name: 'Darkrai VSTAR',
            supertype: 'Pokémon',
            type: 'Darkness',
            rarity: 'Rare Holo VSTAR',
            set: { id: 'swsh10', name: 'Astral Radiance' },
            number: '90',
            images: { small: 'https://images.pokemontcg.io/swsh10/90.png' },
            collectionCount: 17,
            artist: "5ban Graphics",
            hp: "280",
            flavorText: "This Pokémon makes people and Pokémon fall into deep sleeps and then shows them nightmares."
          },
          {
            id: 'sv5-1',
            name: 'Oddish',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Common',
            set: { id: 'sv5', name: 'Paldean Fates' },
            number: '1',
            images: { small: 'https://images.pokemontcg.io/sv5/1.png' },
            collectionCount: 47,
            artist: "Mina Nakai",
            hp: "60",
            flavorText: "It grows by absorbing moonlight. During the daytime, it buries itself in the ground, leaving only its leaves exposed to the sunlight."
          },
          {
            id: 'sv5-110',
            name: 'Glimmet',
            supertype: 'Pokémon',
            type: 'Rock',
            rarity: 'Common',
            set: { id: 'sv5', name: 'Paldean Fates' },
            number: '110',
            images: { small: 'https://images.pokemontcg.io/sv5/110.png' },
            collectionCount: 28,
            artist: "Atsuko Nishida",
            hp: "80",
            flavorText: "This Pokémon lives in caves and mines. It feeds on minerals and uses them to create crystals that grow on its body."
          },
          {
            id: 'sv5-160',
            name: 'Legendary Treasures of Ruin',
            supertype: 'Trainer',
            type: 'Item',
            rarity: 'Uncommon',
            set: { id: 'sv5', name: 'Paldean Fates' },
            number: '160',
            images: { small: 'https://images.pokemontcg.io/sv5/160.png' },
            collectionCount: 12,
            artist: "Toyste Beach"
          },
          {
            id: 'svp-1',
            name: 'Rowlet',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Common',
            set: { id: 'svp', name: 'Scarlet & Violet Promos' },
            number: '1',
            images: { small: 'https://images.pokemontcg.io/svp/1.png' },
            collectionCount: 37,
            artist: "Atsuko Nishida",
            hp: "60",
            flavorText: "This wary Pokémon uses photosynthesis to store up energy during the day and becomes active at night."
          },
          {
            id: 'svp-52',
            name: 'Meowscarada ex',
            supertype: 'Pokémon',
            type: 'Grass',
            rarity: 'Rare Holo',
            set: { id: 'svp', name: 'Scarlet & Violet Promos' },
            number: '52',
            images: { small: 'https://images.pokemontcg.io/svp/52.png' },
            collectionCount: 22,
            artist: "5ban Graphics",
            hp: "230",
            flavorText: "Using the flower-shaped organs on its neck, it emits a sweet aroma that causes opponents to lose their will to battle."
          }
        ];
      }
    },
  });

  const { data: sets = [], isLoading: isSetsLoading } = useQuery({
    queryKey: ['/api/admin/sets'],
    queryFn: async () => {
      try {
        // In a real implementation this would fetch from the server
        const res = await fetch('/api/admin/sets');
        if (!res.ok) throw new Error('Failed to fetch sets');
        return await res.json();
      } catch (error) {
        console.error('Error fetching sets:', error);
        
        // For demonstration purposes we use example data with a more comprehensive list
        return [
          { 
            id: 'swsh12', 
            name: 'Silver Tempest', 
            series: 'Sword & Shield',
            printedTotal: 195,
            total: 215,
            releaseDate: '2022/11/11',
            updatedAt: '2023/02/01',
            images: {
              symbol: 'https://images.pokemontcg.io/swsh12/symbol.png',
              logo: 'https://images.pokemontcg.io/swsh12/logo.png'
            },
            description: "The Silver Tempest set introduced several powerful Pokémon V cards.",
          },
          { 
            id: 'sv1', 
            name: 'Scarlet & Violet',
            series: 'Scarlet & Violet',
            printedTotal: 180,
            total: 200,
            releaseDate: '2023/03/31',
            updatedAt: '2023/05/01',
            images: {
              symbol: 'https://images.pokemontcg.io/sv1/symbol.png',
              logo: 'https://images.pokemontcg.io/sv1/logo.png'
            },
            description: "The Paldea region comes to the Pokémon TCG with the Scarlet & Violet set featuring powerful ex Pokémon.",
          },
          {
            id: 'sv2', 
            name: 'Paldea Evolved',
            series: 'Scarlet & Violet',
            printedTotal: 193,
            total: 217,
            releaseDate: '2023/06/09',
            updatedAt: '2023/07/15',
            images: {
              symbol: 'https://images.pokemontcg.io/sv2/symbol.png',
              logo: 'https://images.pokemontcg.io/sv2/logo.png'
            },
            description: "Paldea Evolved expands on the Paldea region with evolved forms and introduces exciting Tera type mechanics.",
          },
          {
            id: 'sv3', 
            name: 'Obsidian Flames',
            series: 'Scarlet & Violet',
            printedTotal: 194,
            total: 226,
            releaseDate: '2023/08/11',
            updatedAt: '2023/09/05',
            images: {
              symbol: 'https://images.pokemontcg.io/sv3/symbol.png',
              logo: 'https://images.pokemontcg.io/sv3/logo.png'
            },
            description: "The Obsidian Flames set introduces the Tera Charizard ex and many powerful Fire-type Pokémon with stunning alternate art cards.",
          },
          {
            id: 'sv4', 
            name: 'Paradox Rift',
            series: 'Scarlet & Violet',
            printedTotal: 182,
            total: 215,
            releaseDate: '2023/11/03',
            updatedAt: '2023/12/01',
            images: {
              symbol: 'https://images.pokemontcg.io/sv4/symbol.png',
              logo: 'https://images.pokemontcg.io/sv4/logo.png'
            },
            description: "Paradox Rift features Ancient and Future Paradox Pokémon including Iron Treads ex and Roaring Moon ex.",
          },
          {
            id: 'sv4pt5', 
            name: 'Temporal Forces',
            series: 'Scarlet & Violet',
            printedTotal: 177,
            total: 187,
            releaseDate: '2024/01/26',
            updatedAt: '2024/02/15',
            images: {
              symbol: 'https://images.pokemontcg.io/sv4pt5/symbol.png',
              logo: 'https://images.pokemontcg.io/sv4pt5/logo.png'
            },
            description: "Temporal Forces showcases Legendary Pokémon from across time and space including Koraidon ex and Miraidon ex.",
          },
          {
            id: 'sve', 
            name: 'Scarlet & Violet—Evolving Powers',
            series: 'Scarlet & Violet',
            printedTotal: 177,
            total: 198,
            releaseDate: '2023/09/22',
            updatedAt: '2023/10/01',
            images: {
              symbol: 'https://images.pokemontcg.io/sve/symbol.png',
              logo: 'https://images.pokemontcg.io/sve/logo.png'
            },
            description: "Evolving Powers highlights the evolutionary journey of Pokémon with powerful cards that focus on evolution mechanics.",
          },
          {
            id: 'sm8', 
            name: 'Lost Thunder',
            series: 'Sun & Moon',
            printedTotal: 214,
            total: 236,
            releaseDate: '2018/11/02',
            updatedAt: '2019/01/28',
            images: {
              symbol: 'https://images.pokemontcg.io/sm8/symbol.png',
              logo: 'https://images.pokemontcg.io/sm8/logo.png'
            },
            description: "Lost Thunder was one of the largest Pokémon TCG expansions at the time of its release with powerful GX Pokémon and the introduction of Lost Zone mechanics.",
          },
          {
            id: 'swsh4', 
            name: 'Vivid Voltage',
            series: 'Sword & Shield',
            printedTotal: 185,
            total: 203,
            releaseDate: '2020/11/13',
            updatedAt: '2020/11/20',
            images: {
              symbol: 'https://images.pokemontcg.io/swsh4/symbol.png',
              logo: 'https://images.pokemontcg.io/swsh4/logo.png'
            },
            description: "Vivid Voltage introduced the highly sought after Amazing Rare card type and featured the popular Rainbow Rare Pikachu VMAX.",
          },
          {
            id: 'swsh6', 
            name: 'Chilling Reign',
            series: 'Sword & Shield',
            printedTotal: 198,
            total: 233,
            releaseDate: '2021/06/18',
            updatedAt: '2021/06/25',
            images: {
              symbol: 'https://images.pokemontcg.io/swsh6/symbol.png',
              logo: 'https://images.pokemontcg.io/swsh6/logo.png'
            },
            description: "Chilling Reign focuses on the Crown Tundra DLC with both Calyrex forms, the Galarian Legendary birds, and Shadow Rider and Ice Rider Calyrex.",
          },
          {
            id: 'swsh7', 
            name: 'Evolving Skies',
            series: 'Sword & Shield',
            printedTotal: 203,
            total: 237,
            releaseDate: '2021/08/27',
            updatedAt: '2021/09/10',
            images: {
              symbol: 'https://images.pokemontcg.io/swsh7/symbol.png',
              logo: 'https://images.pokemontcg.io/swsh7/logo.png'
            },
            description: "Evolving Skies features all Eevee evolutions in both V and VMAX forms, as well as Dragon-type Pokémon returning to the TCG for the first time in the Sword & Shield era.",
          },
          {
            id: 'swsh10', 
            name: 'Astral Radiance',
            series: 'Sword & Shield',
            printedTotal: 189,
            total: 216,
            releaseDate: '2022/05/27',
            updatedAt: '2022/06/15',
            images: {
              symbol: 'https://images.pokemontcg.io/swsh10/symbol.png',
              logo: 'https://images.pokemontcg.io/swsh10/logo.png'
            },
            description: "Astral Radiance is based on the Legends: Arceus game, featuring Origin Forme Dialga and Origin Forme Palkia, as well as Hisuian Pokémon and the new VSTAR evolution mechanic.",
          },
          {
            id: 'sv5', 
            name: 'Paldean Fates',
            series: 'Scarlet & Violet',
            printedTotal: 180,
            total: 192,
            releaseDate: '2024/01/26',
            updatedAt: '2024/02/15',
            images: {
              symbol: 'https://images.pokemontcg.io/sv5/symbol.png',
              logo: 'https://images.pokemontcg.io/sv5/logo.png'
            },
            description: "Paldean Fates features Shiny Pokémon from the Paldea region with sought-after Tera Pokémon ex and ACE SPEC Trainer cards.",
          },
          {
            id: 'svp', 
            name: 'Scarlet & Violet Promos',
            series: 'Scarlet & Violet',
            printedTotal: 100,
            total: 100,
            releaseDate: '2023/03/31',
            updatedAt: '2024/03/20',
            images: {
              symbol: 'https://images.pokemontcg.io/svp/symbol.png',
              logo: 'https://images.pokemontcg.io/svp/logo.png'
            },
            description: "The Scarlet & Violet Promo set features various promotional cards released alongside main Scarlet & Violet expansions, including box promos, special collection cards, and event exclusives.",
          }
        ];
      }
    },
  });

  // Filter cards
  const filteredCards = cards.filter((card: Card) => {
    // Filter by search term
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by set
    if (selectedSet !== 'all' && card.set.id !== selectedSet) {
      return false;
    }
    
    // Filter by type
    if (selectedType !== 'all' && card.type !== selectedType) {
      return false;
    }
    
    return true;
  });

  // Card type options
  const types = [
    { id: 'all', name: 'All types' },
    { id: 'Grass', name: 'Grass' },
    { id: 'Fire', name: 'Fire' },
    { id: 'Water', name: 'Water' },
    { id: 'Lightning', name: 'Lightning' },
    { id: 'Psychic', name: 'Psychic' },
    { id: 'Fighting', name: 'Fighting' },
    { id: 'Darkness', name: 'Darkness' },
    { id: 'Metal', name: 'Metal' },
    { id: 'Fairy', name: 'Fairy' },
    { id: 'Dragon', name: 'Dragon' },
    { id: 'Colorless', name: 'Colorless' },
  ];

  // Card rarity options
  const rarities = [
    "Common",
    "Uncommon",
    "Rare",
    "Rare Holo",
    "Rare Ultra",
    "Rare Holo EX", 
    "Rare Holo GX",
    "Rare Holo V",
    "Rare Holo VMAX",
    "Rare Holo VSTAR",
    "Rare ACE",
    "Rare BREAK",
    "Rare Prism Star",
    "Rare Secret",
    "Rare Shiny", 
    "Rare Rainbow",
    "Rare Shining",
    "Amazing Rare"
  ];

  // Card supertype options
  const supertypes = [
    "Pokémon",
    "Trainer",
    "Energy"
  ];

  // Mutations
  const addSetMutation = useMutation({
    mutationFn: async (newSet: z.infer<typeof setFormSchema>) => {
      // In a real implementation this would send to the server
      // For now, we'll simulate the response
      return { 
        id: `set_${Date.now().toString(36)}`, 
        ...newSet,
        printedTotal: 0,
        total: 0,
        images: {
          symbol: newSet.symbolUrl,
          logo: newSet.logoUrl
        }
      };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Set has been added successfully",
      });
      setIsAddSetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sets'] });
      setForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add set: " + error.message,
        variant: "destructive",
      });
    }
  });

  const editSetMutation = useMutation({
    mutationFn: async (updatedSet: z.infer<typeof setFormSchema> & { id: string }) => {
      // In a real implementation this would send to the server
      return updatedSet;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Set has been updated successfully",
      });
      setIsEditSetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sets'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update set: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      // In a real implementation this would send to the server
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Set has been deleted successfully",
      });
      setIsDeleteSetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sets'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete set: " + error.message,
        variant: "destructive",
      });
    }
  });

  const addCardMutation = useMutation({
    mutationFn: async (newCard: z.infer<typeof cardFormSchema>) => {
      // In a real implementation this would send to the server
      // For now, we'll simulate the response
      const set = sets.find((s: Set) => s.id === newCard.setId);
      return {
        id: `${newCard.setId}-${newCard.number}`,
        ...newCard,
        set: {
          id: newCard.setId,
          name: set?.name || ""
        },
        images: {
          small: newCard.imageUrl || "https://via.placeholder.com/245x342/888/fff?text=No+Image",
        },
        collectionCount: 0
      };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card has been added successfully",
      });
      setIsAddCardDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cards'] });
      cardForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add card: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onAddSetSubmit = (data: z.infer<typeof setFormSchema>) => {
    addSetMutation.mutate(data);
  };

  const onEditSetSubmit = (data: z.infer<typeof setFormSchema>) => {
    if (selectedSetDetails) {
      editSetMutation.mutate({ ...data, id: selectedSetDetails.id });
    }
  };

  const onDeleteSet = () => {
    if (selectedSetDetails) {
      deleteSetMutation.mutate(selectedSetDetails.id);
    }
  };

  const onAddCardSubmit = (data: z.infer<typeof cardFormSchema>) => {
    addCardMutation.mutate(data);
  };

  // Effect to populate the edit set form when a set is selected
  useEffect(() => {
    if (selectedSetDetails && isEditSetDialogOpen) {
      setForm.reset({
        name: selectedSetDetails.name,
        series: selectedSetDetails.series,
        releaseDate: selectedSetDetails.releaseDate || "",
        description: selectedSetDetails.description || "",
        logoUrl: selectedSetDetails.images?.logo || "",
        symbolUrl: selectedSetDetails.images?.symbol || "",
      });
    }
  }, [selectedSetDetails, isEditSetDialogOpen, setForm]);

  return (
    <AdminLayout title="Card Management">
      <Tabs defaultValue="cards" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Cards
            </TabsTrigger>
            <TabsTrigger value="sets" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" /> Sets
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Cards Tab */}
        <TabsContent value="cards" className="w-full">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Cards</CardTitle>
                <CardDescription>Manage cards in the system</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setIsAddCardDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Card Manually
                </Button>
                <Button className="flex items-center bg-purple-600 hover:bg-purple-700">
                  <FileUp className="mr-2 h-4 w-4" /> Import Cards
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search by card name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Select value={selectedSet} onValueChange={setSelectedSet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sets</SelectItem>
                    {sets.map((set: Set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isCardsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredCards.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Set</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rarity</TableHead>
                        <TableHead>Collections</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((card: Card) => (
                        <TableRow key={card.id}>
                          <TableCell>
                            <img
                              src={card.imageUrl || `https://via.placeholder.com/150x210?text=${encodeURIComponent(card.name)}`}
                              alt={card.name}
                              className="w-12 h-auto rounded"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/150x210?text=${encodeURIComponent(card.name)}`;
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{card.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {card.number || 'N/A'} - {card.type || 'Card'}
                            </div>
                          </TableCell>
                          <TableCell>{card.setName || card.set || 'Unknown Set'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {card.type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{card.rarity || 'Unknown'}</TableCell>
                          <TableCell>{card.collectionCount || 0} collections</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCard(card);
                                  setIsViewDialogOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Card
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Card
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No cards found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sets Tab */}
        <TabsContent value="sets" className="w-full">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Sets</CardTitle>
                <CardDescription>Manage Pokémon card sets in the system</CardDescription>
              </div>
              <Button 
                className="flex items-center bg-purple-600 hover:bg-purple-700" 
                onClick={() => setIsAddSetDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Set
              </Button>
            </CardHeader>
            <CardContent>
              {isSetsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : sets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sets.map((set: Set) => (
                    <Card key={set.id} className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-700 flex items-center justify-center p-4">
                        {set.images?.logo ? (
                          <img 
                            src={set.images.logo} 
                            alt={`${set.name} logo`} 
                            className="max-h-20 max-w-full object-contain" 
                          />
                        ) : (
                          <h3 className="text-white font-bold text-lg text-center">{set.name}</h3>
                        )}
                      </div>
                      <CardContent className="p-4 pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{set.name}</h3>
                            <p className="text-sm text-muted-foreground">{set.series}</p>
                          </div>
                          {set.images?.symbol && (
                            <img 
                              src={set.images.symbol} 
                              alt={`${set.name} symbol`} 
                              className="h-8 w-8 object-contain" 
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center mt-4 text-sm text-muted-foreground gap-4">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            <span>{set.total} cards</span>
                          </div>
                          {set.releaseDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(set.releaseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {set.description && (
                          <p className="mt-4 text-sm line-clamp-2">{set.description}</p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => {
                            setSelectedSetDetails(set);
                            setIsEditSetDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedSetDetails(set);
                            setIsDeleteSetDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-8 text-muted-foreground">
                  No sets found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Card Details</DialogTitle>
            <DialogDescription>
              Details for card <strong>{selectedCard?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCard && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <img
                    src={selectedCard.images.small}
                    alt={selectedCard.name}
                    className="w-full rounded-md shadow-md"
                  />
                </div>
                <div className="w-full md:w-2/3 space-y-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p>{selectedCard.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Type</p>
                        <p>{selectedCard.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Supertype</p>
                        <p>{selectedCard.supertype}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Rarity</p>
                        <p>{selectedCard.rarity}</p>
                      </div>
                      {selectedCard.hp && (
                        <div>
                          <p className="text-sm font-medium">HP</p>
                          <p>{selectedCard.hp}</p>
                        </div>
                      )}
                      {selectedCard.artist && (
                        <div>
                          <p className="text-sm font-medium">Artist</p>
                          <p>{selectedCard.artist}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Set Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Set Name</p>
                        <p>{selectedCard.set.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Set ID</p>
                        <p>{selectedCard.set.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Card Number</p>
                        <p>{selectedCard.number}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedCard.flavorText && (
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-600 mb-2">Flavor Text</h3>
                      <p className="italic text-sm">{selectedCard.flavorText}</p>
                    </div>
                  )}
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Collection Statistics</h3>
                    <div>
                      <p className="text-sm font-medium">Found in Collections</p>
                      <p>{selectedCard.collectionCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
            <DialogDescription>
              Add a new Pokémon card to the system
            </DialogDescription>
          </DialogHeader>
          <Form {...cardForm}>
            <form onSubmit={cardForm.handleSubmit(onAddCardSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={cardForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Charizard" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="setId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set*</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a set" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sets.map((set: Set) => (
                            <SelectItem key={set.id} value={set.id}>
                              {set.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="supertype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supertype*</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card supertype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supertypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types.filter(t => t.id !== 'all').map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="rarity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rarity*</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card rarity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rarities.map((rarity) => (
                            <SelectItem key={rarity} value={rarity}>
                              {rarity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="hp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HP</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ken Sugimori" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Card Image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-start">
                          <Input placeholder="URL to the card image" {...field} className="flex-1" />
                          {field.value && (
                            <div className="w-10 h-14 border rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={field.value} 
                                alt="Card preview" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMTVWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMi4wMDk5IDEwLjAxVjEwLjAwOTkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIxIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTYuNUgxMEgxNCgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Provide a URL to the card image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={cardForm.control}
                  name="flavorText"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Flavor Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description or flavor text for the card"
                          {...field}
                          className="resize-none min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddCardDialogOpen(false)}
                  disabled={addCardMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={addCardMutation.isPending}
                >
                  {addCardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Card
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Set Dialog */}
      <Dialog open={isAddSetDialogOpen} onOpenChange={setIsAddSetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Set</DialogTitle>
            <DialogDescription>
              Add a new Pokémon card set to the system
            </DialogDescription>
          </DialogHeader>
          <Form {...setForm}>
            <form onSubmit={setForm.handleSubmit(onAddSetSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={setForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Scarlet & Violet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sword & Shield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="releaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-start">
                          <Input placeholder="URL to the set logo" {...field} className="flex-1" />
                          {field.value && (
                            <div className="w-10 h-10 border rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={field.value} 
                                alt="Logo preview" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMTVWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMi4wMDk5IDEwLjAxVjEwLjAwOTkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIxIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTYuNUgxMEgxNCgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="symbolUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-start">
                          <Input placeholder="URL to the set symbol" {...field} className="flex-1" />
                          {field.value && (
                            <div className="w-10 h-10 border rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={field.value} 
                                alt="Symbol preview" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMTVWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMi4wMDk5IDEwLjAxVjEwLjAwOTkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIxIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTYuNUgxMEgxNCgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description of the card set"
                          {...field}
                          className="resize-none min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSetDialogOpen(false)}
                  disabled={addSetMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={addSetMutation.isPending}
                >
                  {addSetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Set
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Set Dialog */}
      <Dialog open={isEditSetDialogOpen} onOpenChange={setIsEditSetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Set</DialogTitle>
            <DialogDescription>
              Edit details for set <strong>{selectedSetDetails?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Form {...setForm}>
            <form onSubmit={setForm.handleSubmit(onEditSetSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={setForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Scarlet & Violet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sword & Shield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="releaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-start">
                          <Input placeholder="URL to the set logo" {...field} className="flex-1" />
                          {field.value && (
                            <div className="w-10 h-10 border rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={field.value} 
                                alt="Logo preview" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMTVWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMi4wMDk5IDEwLjAxVjEwLjAwOTkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIxIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTYuNUgxMEgxNCgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="symbolUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-start">
                          <Input placeholder="URL to the set symbol" {...field} className="flex-1" />
                          {field.value && (
                            <div className="w-10 h-10 border rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={field.value} 
                                alt="Symbol preview" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMTVWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMi4wMDk5IDEwLjAxVjEwLjAwOTkiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIxIDE2LjVMMTIgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTYuNUgxMEgxNCgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={setForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description of the card set"
                          {...field}
                          className="resize-none min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditSetDialogOpen(false)}
                  disabled={editSetMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={editSetMutation.isPending}
                >
                  {editSetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Set Confirmation Dialog */}
      <Dialog open={isDeleteSetDialogOpen} onOpenChange={setIsDeleteSetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the set <strong>{selectedSetDetails?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will also delete all cards in this set that are not part of any collection.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteSetDialogOpen(false)}
              disabled={deleteSetMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={onDeleteSet}
              disabled={deleteSetMutation.isPending}
            >
              {deleteSetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CardsPage;