import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GuestVoteEmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export const GuestVoteEmailField = ({
  value,
  onChange,
  id = 'guest-vote-email',
}: GuestVoteEmailFieldProps) => (
  <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
    <p className="text-sm font-medium">Enter your email to cast your vote:</p>
    <div className="space-y-2">
      <Label htmlFor={id}>Email *</Label>
      <Input
        id={id}
        type="email"
        placeholder="your@email.com"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        autoComplete="email"
      />
    </div>
  </div>
);
