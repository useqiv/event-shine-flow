import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUpdateTicketType, useDeleteTicketType } from '@/hooks/useOrganization';
import { Loader2, Trash2 } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  description: string | null;
}

interface EditTicketTypeDialogProps {
  ticketType: TicketType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditTicketTypeDialog: React.FC<EditTicketTypeDialogProps> = ({
  ticketType,
  open,
  onOpenChange,
}) => {
  const updateTicketType = useUpdateTicketType();
  const deleteTicketType = useDeleteTicketType();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity_available: '',
    description: '',
  });

  useEffect(() => {
    if (ticketType) {
      setFormData({
        name: ticketType.name,
        price: String(ticketType.price),
        quantity_available: String(ticketType.quantity_available),
        description: ticketType.description || '',
      });
    }
  }, [ticketType]);

  const handleSave = async () => {
    if (!ticketType || !formData.name || !formData.price || !formData.quantity_available) return;

    await updateTicketType.mutateAsync({
      id: ticketType.id,
      name: formData.name,
      price: Number(formData.price),
      quantity_available: Number(formData.quantity_available),
      description: formData.description || undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!ticketType) return;
    await deleteTicketType.mutateAsync(ticketType.id);
    onOpenChange(false);
  };

  const canDelete = ticketType && ticketType.quantity_sold === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ticket Type</DialogTitle>
          <DialogDescription>
            Update the ticket type details. {ticketType?.quantity_sold || 0} tickets have been sold.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="e.g., VIP, Regular, Early Bird"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₦) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Quantity *</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.quantity_available}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_available: e.target.value }))}
                min={ticketType?.quantity_sold || 0}
              />
              {ticketType && ticketType.quantity_sold > 0 && (
                <p className="text-xs text-muted-foreground">
                  Minimum: {ticketType.quantity_sold} (already sold)
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What's included with this ticket..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={!canDelete || deleteTicketType.isPending}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{ticketType?.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateTicketType.isPending}>
            {updateTicketType.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>

        {!canDelete && ticketType && ticketType.quantity_sold > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Cannot delete ticket types that have sold tickets.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditTicketTypeDialog;
