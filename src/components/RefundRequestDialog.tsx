import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

interface RefundRequestDialogProps {
  transactionType: 'ticket' | 'vote';
  transactionId: string;
  amount: number;
  itemName: string;
  children?: React.ReactNode;
}

const RefundRequestDialog: React.FC<RefundRequestDialogProps> = ({
  transactionType,
  transactionId,
  amount,
  itemName,
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Check if user already has a pending refund for this transaction
  const { data: existingRefund } = useQuery({
    queryKey: ['existing-refund', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select('id, status')
        .eq('original_transaction_id', transactionId)
        .eq('original_transaction_type', transactionType)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!user,
  });

  // Get user's recent refund requests for fraud detection warning
  const { data: recentRefunds } = useQuery({
    queryKey: ['recent-refunds', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('refunds')
        .select('id, amount, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user,
  });

  const submitRefundMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Submit refund request
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          original_transaction_type: transactionType,
          original_transaction_id: transactionId,
          user_id: user.id,
          amount,
          reason,
          status: 'pending',
        })
        .select()
        .single();
      
      if (refundError) throw refundError;

      // Run fraud detection
      await checkAndFlagFraud(refund.id, user.id, amount);

      return refund;
    },
    onSuccess: () => {
      toast.success('Refund request submitted', {
        description: 'Your request is being reviewed by our team.',
      });
      queryClient.invalidateQueries({ queryKey: ['existing-refund', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['recent-refunds', user?.id] });
      setIsOpen(false);
      setReason('');
    },
    onError: (error) => {
      toast.error('Failed to submit refund request', {
        description: error.message,
      });
    },
  });

  const checkAndFlagFraud = async (refundId: string, userId: string, refundAmount: number) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get user's refund history
    const { data: refundHistory } = await supabase
      .from('refunds')
      .select('id, amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    const recentCount = refundHistory?.length || 0;
    const totalRefundAmount = refundHistory?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    
    const alerts: { type: string; severity: string; description: string }[] = [];
    
    // Check for multiple refund requests (more than 3 in 30 days)
    if (recentCount > 3) {
      alerts.push({
        type: 'multiple_refunds',
        severity: 'medium',
        description: `User has made ${recentCount} refund requests in the last 30 days`,
      });
    }
    
    // Check for high refund amount (over 50,000 NGN single request)
    if (refundAmount > 50000) {
      alerts.push({
        type: 'high_amount',
        severity: 'high',
        description: `High refund amount: ₦${refundAmount.toLocaleString()}`,
      });
    }
    
    // Check for high total refund volume (over 100,000 NGN in 30 days)
    if (totalRefundAmount > 100000) {
      alerts.push({
        type: 'high_volume',
        severity: 'high',
        description: `User has requested ₦${totalRefundAmount.toLocaleString()} in refunds in 30 days`,
      });
    }
    
    // Check for rapid-fire requests (more than 2 in same day)
    const today = new Date().toDateString();
    const todayRefunds = refundHistory?.filter(r => 
      new Date(r.created_at).toDateString() === today
    ).length || 0;
    
    if (todayRefunds > 2) {
      alerts.push({
        type: 'rapid_requests',
        severity: 'medium',
        description: `User made ${todayRefunds} refund requests today`,
      });
    }
    
    // Create fraud alerts if any suspicious patterns detected
    for (const alert of alerts) {
      await supabase.from('fraud_alerts').insert({
        alert_type: alert.type,
        entity_type: 'refund',
        entity_id: refundId,
        severity: alert.severity,
        description: alert.description,
        metadata: {
          user_id: userId,
          refund_amount: refundAmount,
          recent_refund_count: recentCount,
          total_refund_amount: totalRefundAmount,
        },
      });
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your refund request');
      return;
    }
    submitRefundMutation.mutate();
  };

  const hasExistingRequest = existingRefund !== null;
  const warningThreshold = (recentRefunds?.length || 0) >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Request Refund
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Submit a refund request for your {transactionType} purchase
          </DialogDescription>
        </DialogHeader>

        {hasExistingRequest ? (
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You already have a {existingRefund?.status} refund request for this {transactionType}.
                {existingRefund?.status === 'pending' && ' Please wait for it to be reviewed.'}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium">{itemName}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₦{amount.toLocaleString()}</span>
              </div>
            </div>

            {warningThreshold && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have made multiple refund requests recently. Excessive requests may delay processing.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for refund *</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you're requesting a refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear explanation to help us process your request faster.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {!hasExistingRequest && (
            <Button 
              onClick={handleSubmit} 
              disabled={submitRefundMutation.isPending || !reason.trim()}
            >
              {submitRefundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestDialog;
