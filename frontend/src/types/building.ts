export interface City {
  id: number;
  name: string;
}

export type ContactType = 'email' | 'whatsapp' | 'phone';
/** `tenant` = renter. */
export type RelationType = 'owner' | 'tenant';
export type PaymentMethod = 'cash' | 'transfer' | 'bit' | 'paybox';

export interface ContactLink {
  id: number;
  type: ContactType;
  link: string;
}

/** Role inside one building: management (committee head, management company — same level), then residents. */
export const BUILDING_ROLES = ['committee_head', 'management_company', 'resident'] as const;
export type BuildingRole = (typeof BUILDING_ROLES)[number];

/** A profile picture: uploaded one (version changes per upload) wins over the Google photo URL. */
export interface Picture {
  google: string | null;
  version: string | null;
}

/** One of the user's apartments in a building (technical info, set by building management). */
export interface MyApartment {
  number: number;
  floor: number | null;
  sqrm: number | null;
  monthlyPayment: number | null;
  paymentMethod: PaymentMethod | null;
  relationType: RelationType;
}

/** What the user suggested when joining — pending until management confirms. */
export interface JoinRequest {
  apartment: number | null;
  relationType: RelationType | null;
}

/** Summary shape — what the building picker (GET /buildings) returns. */
export interface BuildingSummary {
  id: string;
  name: string;
  address: string;
  city: City;
}

/** A building the user belongs to (GET /buildings/mine), from their point of view. */
export interface Building extends BuildingSummary {
  description: string | null;
  entryCode: string | null;
  contactLinks: ContactLink[];
  memberCount: number;
  myRole: BuildingRole;
  /** Committee head / management company here, or an admin. */
  canManage: boolean;
  myApartments: MyApartment[];
  myRequest: JoinRequest | null;
}

export const MESSAGE_TYPES = ['general', 'urgent', 'maintenance'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export interface Message {
  id: string;
  buildingId: string;
  /** null = the author deleted their account ("Former resident"). */
  authorId: string | null;
  author: { id: string; name: string | null } | null;
  type: MessageType;
  title: string;
  description: string | null;
  uploadDate: string;
}

/** The signed-in user as the backend sees them (GET /users/me). */
export interface CurrentUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
  language: string | null;
  picture: Picture;
}

/** A building as listed in the admin panel. */
export interface AdminBuilding {
  id: string;
  name: string;
  address: string;
  description: string | null;
  entryCode: string | null;
  createdAt: string;
  city: City;
  contactLinks: ContactLink[];
  _count: { members: number; messages: number; docs: number };
}

export interface BuildingInput {
  name: string;
  cityId: number;
  address: string;
  password: string;
  description?: string | null;
  entryCode?: string | null;
  contactLinks?: ContactLinkInput[];
}

/** An apartment as shown on the members list; size/fee/payment only reach building management. */
export interface MemberApartment {
  number: number;
  floor: number | null;
  relationType: RelationType;
  sqrm?: number | null;
  monthlyPayment?: number | null;
  paymentMethod?: PaymentMethod | null;
}

export interface Member {
  userId: string;
  name: string | null;
  role: BuildingRole;
  apartments: MemberApartment[];
  picture: Picture;
  /** Only present for building management / admins. */
  phone?: string | null;
  isAdmin?: boolean;
  request?: JoinRequest | null;
}

/** One apartment as building management sets it for a member. */
export interface ApartmentInput {
  number: number;
  relationType: RelationType;
  floor?: number | null;
  sqrm?: number | null;
  paymentMethod?: PaymentMethod | null;
}

export interface BlockedUser {
  userId: string;
  name: string | null;
  email: string | null;
  blockedBy: string | null;
  createdAt: string;
}

export interface Doc {
  id: string;
  buildingId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadDate: string;
  /** null = the uploader deleted their account ("Former resident"). */
  uploader: { id: string; name: string | null } | null;
}

export interface ContactLinkInput {
  type: ContactType;
  link: string;
}
