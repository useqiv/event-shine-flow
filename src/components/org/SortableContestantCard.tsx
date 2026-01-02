import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Vote, LinkIcon, Pencil, Camera, Trash2, GripVertical, QrCode, ImageIcon } from 'lucide-react';
import { ContestantQRDialog } from './ContestantQRDialog';

interface Contestant {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  vote_count: number;
  display_order: number;
}

interface SortableContestantCardProps {
  contestant: Contestant;
  isSelected: boolean;
  contestId: string;
  contestTitle: string;
  brandPrimaryColor?: string;
  customSlug?: string | null;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contestant: Contestant) => void;
  onDelete: (contestant: Contestant) => void;
  onCopyLink: (contestantId: string, contestantName: string) => void;
  onShareCard?: (contestant: Contestant) => void;
}

export const SortableContestantCard: React.FC<SortableContestantCardProps> = ({
  contestant,
  isSelected,
  contestId,
  contestTitle,
  brandPrimaryColor,
  customSlug,
  onSelect,
  onEdit,
  onDelete,
  onCopyLink,
  onShareCard,
}) => {
  const [isQROpen, setIsQROpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contestant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'ring-2 ring-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(contestant.id, checked === true)}
              className="h-4 w-4"
            />
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0 relative group">
            {contestant.photo_url ? (
              <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => onEdit(contestant)}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold">{contestant.name}</h3>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEdit(contestant)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onDelete(contestant)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{contestant.bio}</p>
            <div className="flex items-center gap-2 mt-2">
              <Vote className="h-4 w-4" style={brandPrimaryColor ? { color: brandPrimaryColor } : undefined} />
              <span className="font-medium" style={brandPrimaryColor ? { color: brandPrimaryColor } : undefined}>
                {contestant.vote_count.toLocaleString()} votes
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onCopyLink(contestant.id, contestant.name)}
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setIsQROpen(true)}
          >
            <QrCode className="h-3 w-3 mr-1" />
            QR
          </Button>
          {onShareCard && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onShareCard(contestant)}
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Card
            </Button>
          )}
        </div>
        
        <ContestantQRDialog
          open={isQROpen}
          onOpenChange={setIsQROpen}
          contestantName={contestant.name}
          contestantId={contestant.id}
          contestId={contestId}
          contestTitle={contestTitle}
          customSlug={customSlug}
        />
      </CardContent>
    </Card>
  );
};
