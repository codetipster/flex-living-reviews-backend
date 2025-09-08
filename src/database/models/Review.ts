export interface ReviewEntity {
  id: string;
  externalId: string; // Original ID from Hostaway
  propertyName: string;
  guestName: string;
  reviewText: string;
  overallRating: number;
  categories: ReviewCategories;
  submittedAt: Date;
  channel: ReviewChannel;
  status: ReviewStatus;
  type: ReviewType;
  isApprovedForPublic: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCategories {
  cleanliness: number;
  communication: number;
  respect_house_rules: number;
}

export enum ReviewChannel {
  HOSTAWAY = 'hostaway',
  GOOGLE = 'google',
  AIRBNB = 'airbnb'
}

export enum ReviewStatus {
  PUBLISHED = 'published',
  PENDING = 'pending',
  HIDDEN = 'hidden'
}

export enum ReviewType {
  HOST_TO_GUEST = 'host-to-guest',
  GUEST_TO_HOST = 'guest-to-host'
}