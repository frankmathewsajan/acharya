import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
  fee: {
    id: string;
    description: string;
    amount: number;
    invoice_number: string;
    fee_type?: string;
    due_date?: string;
  };
  loading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fee,
  loading = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  const amount = fee.amount;
  const isLowAmount = amount < 15000;
  
  // Payment method options based on amount
  const paymentMethods = isLowAmount 
    ? [
        { id: 'upi', label: 'UPI Payment', icon: Smartphone, description: 'Pay using UPI apps like GPay, PhonePe, Paytm' },
        { id: 'online', label: 'Online Banking', icon: Building2, description: 'Net banking from your bank' }
      ]
    : [
        { id: 'online', label: 'Online Banking', icon: Building2, description: 'Net banking from your bank' },
        { id: 'card', label: 'Debit/Credit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay cards' }
      ];

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Confirmation
          </DialogTitle>
          <DialogDescription>
            Review your payment details and select payment method
          </DialogDescription>
        </DialogHeader>

        {/* Payment Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Description:</span>
              <span className="text-sm font-medium">{fee.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Invoice:</span>
              <span className="text-sm font-mono">{fee.invoice_number}</span>
            </div>
            {fee.fee_type && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="outline">{fee.fee_type}</Badge>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-lg font-bold text-primary">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Payment Method</CardTitle>
            <CardDescription className="text-xs">
              {isLowAmount 
                ? 'For amounts below ₹15,000, UPI and Online Banking are available'
                : 'For amounts ₹15,000 and above, Online Banking and Cards are recommended'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <RadioGroupItem value={method.id} id={method.id} className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMethod || loading}
            className="min-w-[120px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;