export interface Nation {
  id: string;
  name: string;
  code: string;
  flag?: string;
}

export interface Player {
  id: string;
  name: string;
  surname?: string;
  nationId?: string | null;
  Nation?: Nation | null;
  image?: string;
  biography?: string;
  PlayerKit: PlayerKit[];
}

export interface Kit {
  id: string;
  name: string;
  team: string;
  type: string;
  imageUrl?: string;
  model3DUrl?: string;
  logoUrl?: string;
}

export interface PlayerKit {
  id: string;
  playerId: string;
  kitId: string;
  Kit: Kit;
}
