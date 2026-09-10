import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddressWithNominatim } from '@/lib/geocoding';
import { geocodeAddressSchema } from '@/schemas/geocode';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = geocodeAddressSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Address string must be provided' },
        { status: 400 }
      );
    }

    const geocodeResult = await geocodeAddressWithNominatim(
      parseResult.data.address
    );

    if (!geocodeResult) {
      return NextResponse.json(
        { error: 'Could not geocode the provided address' },
        { status: 404 }
      );
    }

    return NextResponse.json(geocodeResult);
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during geocoding' },
      { status: 500 }
    );
  }
}
