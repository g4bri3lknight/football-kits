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
  // Detail images (3 left, 3 right)
  detail1Url?: string;
  detail2Url?: string;
  detail3Url?: string;
  detail4Url?: string;
  detail5Url?: string;
  detail6Url?: string;
  // Labels for detail images
  detail1Label?: string;
  detail2Label?: string;
  detail3Label?: string;
  detail4Label?: string;
  detail5Label?: string;
  detail6Label?: string;
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
