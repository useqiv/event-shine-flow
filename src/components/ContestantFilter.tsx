import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ContestantFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const ContestantFilter: React.FC<ContestantFilterProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search by name, state, or country..."
}) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default ContestantFilter;

// Utility function to filter contestants
export const filterContestants = (contestants: any[], searchTerm: string) => {
  if (!searchTerm.trim()) return contestants;
  
  const lowerSearch = searchTerm.toLowerCase().trim();
  
  return contestants.filter((contestant) => {
    const name = (contestant.name || '').toLowerCase();
    const state = (contestant.state || '').toLowerCase();
    const country = (contestant.country || '').toLowerCase();
    const bio = (contestant.bio || '').toLowerCase();
    
    return (
      name.includes(lowerSearch) ||
      state.includes(lowerSearch) ||
      country.includes(lowerSearch) ||
      bio.includes(lowerSearch)
    );
  });
};
