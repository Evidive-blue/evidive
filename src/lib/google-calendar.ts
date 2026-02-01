/**
 * Google Calendar URL Generator for EviDive bookings
 */

interface GoogleCalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Format date to Google Calendar format (YYYYMMDDTHHmmssZ)
 */
function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate a Google Calendar "Add Event" URL
 * @param event - Event details
 * @returns Google Calendar URL string
 */
export function generateGoogleCalendarUrl(event: GoogleCalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.startDate)}/${formatGoogleCalendarDate(event.endDate)}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }

  if (event.location) {
    params.set('location', event.location);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Google Calendar URL from booking data
 */
export function generateBookingCalendarUrl({
  serviceName,
  centerName,
  centerAddress,
  diveDate,
  diveTime,
  durationMinutes,
  reference,
  participants,
  specialRequests,
}: {
  serviceName: string;
  centerName: string;
  centerAddress?: string;
  diveDate: Date;
  diveTime: Date;
  durationMinutes?: number;
  reference: string;
  participants: number;
  specialRequests?: string | null;
}): string {
  // Combine date and time
  const startDate = new Date(diveDate);
  const timeDate = new Date(diveTime);
  startDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

  // Calculate end time (default 2 hours if no duration)
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + (durationMinutes || 120));

  // Build description
  const descriptionParts = [
    `🤿 Réservation EviDive`,
    `Référence: ${reference}`,
    `Centre: ${centerName}`,
    `Participants: ${participants}`,
  ];

  if (specialRequests) {
    descriptionParts.push(`Demandes spéciales: ${specialRequests}`);
  }

  descriptionParts.push('', '---', 'Géré par EviDive - evidive.blue');

  return generateGoogleCalendarUrl({
    title: `🤿 ${serviceName} - ${centerName}`,
    description: descriptionParts.join('\n'),
    location: centerAddress || centerName,
    startDate,
    endDate,
  });
}
