import { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Booking Cancelled | EviDive',
  description: 'Your booking process was cancelled.',
};

interface Props {
  searchParams: Promise<{ reference?: string }>;
}

export default async function BookingCancelPage({ searchParams }: Props) {
  const { reference } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16 pt-24">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white">Payment Cancelled</h1>
          <p className="mt-2 text-white/60">
            Your payment was cancelled. No charges have been made.
          </p>

          {reference && (
            <Card className="mt-6 border-white/10 bg-white/5">
              <CardContent className="p-4">
                <p className="text-sm text-white/60">Booking Reference</p>
                <p className="font-mono text-lg font-bold text-white">{reference}</p>
                <p className="mt-2 text-sm text-amber-400">
                  This booking is pending payment. You can complete the payment later.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {reference && (
              <Link href={`/booking/retry?reference=${reference}`}>
                <Button className="w-full rounded-xl bg-cyan-500 text-slate-900 hover:bg-cyan-400">
                  Try Payment Again
                </Button>
              </Link>
            )}
            <Link href="/centers">
              <Button variant="outline" className="w-full rounded-xl border-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Centers
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="w-full rounded-xl text-white/60">
                <HelpCircle className="mr-2 h-4 w-4" />
                Need Help?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
