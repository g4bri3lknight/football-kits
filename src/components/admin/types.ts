export interface Player {
  id: string;
  name: string;
  surname?: string;
  nationId?: string | null;
  Nation?: any;
  image?: string;
  biography?: string;
}

export interface Nation {
  id: string;
  name: string;
  code: string;
  flag: string;
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
  Player: Player;
  Kit: Kit;
}

export interface AdminPanelProps {
  onClose?: () => void;
  onUpdate?: () => void;
}
