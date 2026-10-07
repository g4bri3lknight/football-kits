'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { League } from './types';

interface LeagueComboboxProps {
  id?: string;
  leagues: League[];
  /** id del campionato selezionato, stringa vuota = nessuno */
  value: string;
  onChange: (leagueId: string) => void;
}

// URL del logo; "t" cambia a ogni modifica per evitare la cache del browser
const logoUrl = (league: League) =>
  `/api/leagues/${league.id}/logo?t=${new Date(league.updatedAt ?? 0).getTime()}`;

function LeagueLabel({ league }: { league: League }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      {league.hasLogo && (
        <img src={logoUrl(league)} alt="" className="w-5 h-5 object-contain shrink-0" />
      )}
      <span className="truncate">
        {league.name}
        <span className="text-muted-foreground"> · {league.season} · {league.nation}</span>
      </span>
    </span>
  );
}

// Select con ricerca per scegliere un campionato tra quelli della tabella League
export default function LeagueCombobox({ id, leagues, value, onChange }: LeagueComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = leagues.find((l) => l.id === value);

  const select = (leagueId: string) => {
    onChange(leagueId);
    setOpen(false);
  };

  return (
    // modal: necessario perché la lista sia scorrevole con la rotella dentro un Dialog
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <LeagueLabel league={selected} />
          ) : (
            <span className="text-muted-foreground">Seleziona campionato...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command>
          <CommandInput placeholder="Cerca per campionato, stagione o nazione..." />
          <CommandList>
            <CommandEmpty>
              {leagues.length === 0
                ? 'Nessun campionato presente: creane uno nella sezione Campionati.'
                : 'Nessun campionato trovato'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem value="nessun campionato" onSelect={() => select('')}>
                <Check className={cn('mr-2 h-4 w-4', value === '' ? 'opacity-100' : 'opacity-0')} />
                <span className="text-muted-foreground">Nessun campionato</span>
              </CommandItem>
              {leagues.map((league) => (
                <CommandItem
                  key={league.id}
                  // valore unico (stagione+campionato+nazione sono univoci): è anche il testo cercato
                  value={`${league.name} ${league.season} ${league.nation}`}
                  onSelect={() => select(league.id)}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4 shrink-0', value === league.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <LeagueLabel league={league} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
