import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Share2, Twitter, Facebook, Link2, MessageCircle } from 'lucide-react';

interface ContestantShareButtonProps {
  contestantName: string;
  contestantId: string;
  contestId: string;
  contestTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ContestantShareButton = ({
  contestantName,
  contestantId,
  contestId,
  contestTitle,
  variant = 'outline',
  size = 'sm',
}: ContestantShareButtonProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const votingLink = `${window.location.origin}/contests/${contestId}?vote=${contestantId}`;
  const shareText = `Vote for ${contestantName} in ${contestTitle}! 🗳️`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(votingLink);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(votingLink);
      toast({
        title: 'Link Copied!',
        description: 'Voting link has been copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link. Please try again.',
        variant: 'destructive',
      });
    }
    setIsOpen(false);
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare} className="cursor-pointer">
          <Twitter className="mr-2 h-4 w-4" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="cursor-pointer">
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Link2 className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContestantShareButton;
