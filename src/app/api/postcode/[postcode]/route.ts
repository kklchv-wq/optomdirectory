import { NextRequest, NextResponse } from 'next/server';
import { lookupUkPostcode } from '@/lib/geocoding';
import { postcodeSearchSchema } from '@/schemas/geocode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postcode: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawPostcode = decodeURIComponent(resolvedParams.postcode);

    const parseResult = postcodeSearchSchema.safeParse({ postcode: rawPostcode });
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid UK postcode format' },
        { status: 400 }
      );
    }

    const result = await lookupUkPostcode(parseResult.data.postcode);
    if (!result) {
      return NextResponse.json(
        { error: 'Postcode not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Postcode API error:', error);
    return NextResponse.json(
      { error: 'Failed to process postcode lookup' },
      { status: 500 }
    );
  }
}
