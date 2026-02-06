/**
 * Script pour corriger manuellement le statut d'un booking après paiement Stripe
 * Usage: npx tsx scripts/fix-booking-status.ts EV-MLAN52ZQ-VTM5
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '../lib/db/prisma';

const bookingRef = process.argv[2];

if (!bookingRef) {
  console.error('❌ Usage: npx tsx scripts/fix-booking-status.ts <BOOKING_REFERENCE>');
  process.exit(1);
}

async function fixBookingStatus() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { reference: bookingRef },
      include: {
        center: { select: { commissionRate: true, name: true, ownerId: true } },
      },
    });

    if (!booking) {
      console.error(`❌ Booking ${bookingRef} non trouvé`);
      process.exit(1);
    }

    console.log('\n📋 Booking actuel:');
    console.log('  Reference:', booking.reference);
    console.log('  Status:', booking.status);
    console.log('  Payment Status:', booking.paymentStatus);
    console.log('  Total:', booking.totalPrice, booking.currency);

    // Mettre à jour le booking
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paidAt: new Date(),
        confirmedAt: new Date(),
      },
    });

    console.log('\n✅ Booking mis à jour:');
    console.log('  Status:', updated.status);
    console.log('  Payment Status:', updated.paymentStatus);
    console.log('  Paid At:', updated.paidAt);

    // Créer la commission si elle n'existe pas
    const existingCommission = await prisma.commission.findFirst({
      where: { bookingId: booking.id },
    });

    if (!existingCommission) {
      const commissionRate = Number(booking.center.commissionRate) / 100;
      const commissionAmount = Number(booking.totalPrice) * commissionRate;
      const centerAmount = Number(booking.totalPrice) - commissionAmount;

      await prisma.commission.create({
        data: {
          bookingId: booking.id,
          centerId: booking.centerId,
          bookingAmount: booking.totalPrice,
          commissionRate: booking.center.commissionRate,
          commissionAmount,
          centerAmount,
          status: 'PENDING',
        },
      });

      console.log('\n💰 Commission créée:');
      console.log('  Montant total:', booking.totalPrice);
      console.log('  Taux commission:', booking.center.commissionRate + '%');
      console.log('  Commission EviDive:', commissionAmount.toFixed(2));
      console.log('  Montant centre:', centerAmount.toFixed(2));
    } else {
      console.log('\n✓ Commission déjà existante');
    }

    // Créer une notification pour le propriétaire du centre
    const centerName = typeof booking.center.name === 'object'
      ? (booking.center.name as Record<string, string>).en || 'Your center'
      : booking.center.name;

    await prisma.notification.create({
      data: {
        diverId: booking.center.ownerId,
        type: 'BOOKING',
        title: 'Booking Confirmed',
        message: `Booking ${booking.reference} for ${centerName} has been manually confirmed.`,
        bookingId: booking.id,
        centerId: booking.centerId,
      },
    });

    console.log('\n🔔 Notification envoyée au propriétaire\n');
    console.log('✅ Terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingStatus();
