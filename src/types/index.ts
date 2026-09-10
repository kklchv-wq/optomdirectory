export interface Speciality {
  id: number;
  name: string;
  slug: string;
  category: 'service' | 'equipment';
  groupName?: string | null;
  description: string | null;
  status?: 'approved' | 'pending' | null;
  offeredBy?: 'personal' | 'practice';
  referralType?: 'referral_required' | 'self_referral';
}

export interface PracticeListing {
  id: number;
  slug: string;
  practiceName: string;
  contactName: string;
  gocNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  editToken?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  specialities: Speciality[];
  distanceMiles?: number;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}
