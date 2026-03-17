// Enum per lo stato dei contenuti
export type ContentStatus = 'NON_IMPOSTATO' | 'NUOVO' | 'AGGIORNATO';

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  NON_IMPOSTATO: 'Non Impostato',
  NUOVO: 'Nuovo',
  AGGIORNATO: 'Aggiornato',
};

export interface Player {
  id: string;
  name: string;
  surname?: string;
  nationId?: string | null;
  Nation?: any;
  hasImage?: boolean;
  biography?: string;
  updatedAt?: string | Date;
  status?: ContentStatus;
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
  likes: number;
  dislikes: number;
  updatedAt?: string | Date;
  status?: ContentStatus;
  // Flag per la presenza di file
  hasImage?: boolean;
  hasLogo?: boolean;
  hasModel3D?: boolean;
  hasDetail1?: boolean;
  hasDetail2?: boolean;
  hasDetail3?: boolean;
  hasDetail4?: boolean;
  hasDetail5?: boolean;
  hasDetail6?: boolean;
  // Labels dei dettagli
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
