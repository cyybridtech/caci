import React from 'react';
import { X, Printer, CheckCircle, Church } from 'lucide-react';
import { FinancialContribution } from '../types/index.ts';

interface ReceiptModalProps {
  contribution: FinancialContribution | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ contribution, onClose }) => {
  if (!contribution) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNo = `REC-${contribution.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden print:m-0 print:w-full print:shadow-none animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls (Hidden in print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <span className="text-sm font-semibold">Official Church Contribution Receipt</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 bg-white text-slate-800 space-y-6 border-4 border-double border-slate-200 m-4 rounded-xl">
          {/* Church Branding Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="flex justify-center mb-1">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 inline-block">
                <Church className="w-8 h-8 mx-auto" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              CHRIST APOSTOLIC CHURCH INT.
            </h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
              Financial Contribution Receipt
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold">
              Receipt #: {receiptNo}
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Date:</span>
              <span className="font-semibold text-slate-800">
                {new Date(contribution.transactionDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Contributor:</span>
              <span className="font-bold text-slate-900">
                {contribution.member
                  ? `${contribution.member.firstName} ${contribution.member.lastName}`
                  : 'General Offering (Anonymous)'}
              </span>
            </div>

            {contribution.member && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Church Group:</span>
                <span className="font-semibold text-blue-700">
                  {contribution.member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Contribution Purpose:</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs">
                {contribution.category.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Payment Mode:</span>
              <span className="font-medium text-slate-700">
                {contribution.paymentMethod.replace('_', ' ')}
              </span>
            </div>

            {contribution.notes && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Notes:</span>
                <span className="font-medium text-slate-700 italic">{contribution.notes}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
              Amount Paid
            </span>
            <span className="text-3xl font-extrabold text-blue-900">
              GHS {Number(contribution.amount).toFixed(2)}
            </span>
          </div>

          {/* Footer & Blessing */}
          <div className="pt-4 border-t border-slate-200 text-center space-y-2">
            <p className="text-xs italic text-slate-600">
              "Bring the whole tithe into the storehouse, that there may be food in my house..." - Malachi 3:10
            </p>
            <div className="flex items-center justify-center space-x-1 text-emerald-600 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified & Recorded at Church Accounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
