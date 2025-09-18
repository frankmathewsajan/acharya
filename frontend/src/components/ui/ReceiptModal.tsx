import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Printer, Share2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  receiptData: {
    transactionId: string;
    amount: number;
    paymentMethod: string;
    description: string;
    invoiceNumber: string;
    feeType?: string;
    studentName: string;
    admissionNumber?: string;
    school: string;
    paymentDate: string;
  };
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  receiptData
}) => {
  const {
    transactionId,
    amount,
    paymentMethod,
    description,
    invoiceNumber,
    feeType,
    studentName,
    admissionNumber,
    school,
    paymentDate
  } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Payment Receipt',
        text: `Payment receipt for ₹${amount.toLocaleString('en-IN')} - Transaction ID: ${transactionId}`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-lg font-semibold">Payment Successful!</DialogTitle>
          <DialogDescription>
            Your payment has been processed successfully
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Content */}
        <Card className="bg-gradient-to-b from-slate-50 to-white border-2">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800">OFFICIAL RECEIPT</h2>
              <p className="text-sm text-slate-600 font-medium">{school}</p>
              <p className="text-xs text-slate-500">Government of Rajasthan</p>
            </div>

            {/* Student Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">
                STUDENT DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>
                  <p className="font-medium">{studentName}</p>
                </div>
                {admissionNumber && (
                  <div>
                    <span className="text-slate-500">Admission No:</span>
                    <p className="font-medium font-mono">{admissionNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">
                PAYMENT DETAILS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-medium text-right">{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-mono text-right">{invoiceNumber}</span>
                </div>
                {feeType && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fee Type:</span>
                    <Badge variant="outline" className="text-xs">{feeType}</Badge>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                  <span className="font-semibold text-slate-700">Amount Paid:</span>
                  <span className="text-lg font-bold text-green-700">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">
                TRANSACTION DETAILS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-right">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="capitalize text-right">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-right">{paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">COMPLETED</Badge>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 text-center">
              <p className="text-xs text-slate-500">
                This is a computer-generated receipt and does not require a signature.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Generated on: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
              <div className="mt-2 text-xs text-slate-400 border-t pt-2">
                <p>Government of Rajasthan - Educational ERP System</p>
                <p>For queries, contact your school administration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            {navigator.share && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;