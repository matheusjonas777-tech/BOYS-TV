import { AppUser as User, Series } from './types';

export const INITIAL_USERS: User[] = [
  {
    email: "admin@boyslovezero.tv",
    password: "ZeroAdmin2026",
    name: "Admin",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  }
];

export const INITIAL_SERIES: Series[] = [
  {
    id: 1,
    title: "Semantic Error",
    cat: "Destaque",
    genres: ["Romance", "Escolar", "Coreia"],
    year: 2022,
    poster: "https://images.unsplash.com/photo-1518107616985-bd48230d3b20?auto=format&fit=crop&q=80&w=600",
    banner: "https://images.unsplash.com/photo-1522865080277-51d22742c237?auto=format&fit=crop&q=80&w=1200",
    desc: "Um estudante de ciência da computação rígido e disciplinado vê seu mundo virar de cabeça para baixo ao cruzar o caminho de um artista de espírito livre.",
    episodes: [
      { title: "Episódio 01", url: "https://short.ink/6k8v2q9" },
      { title: "Episódio 02", url: "https://short.ink/6k8v2q9" }
    ]
  },
  {
    id: 2,
    title: "KinnPorsche",
    cat: "Série",
    genres: ["Ação", "Crime", "Tailândia"],
    year: 2022,
    poster: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600",
    banner: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1200",
    desc: "O filho de um mafioso é forçado a contratar um barman como seu guarda-costas pessoal após um encontro perigoso.",
    episodes: [
      { title: "Episódio 01", url: "https://short.ink/6k8v2q9" }
    ]
  }
];
