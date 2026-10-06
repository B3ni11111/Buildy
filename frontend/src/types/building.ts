export interface City {
  id: number;
  name: string;
}

export type ContactType = 'email' | 'whatsapp' | 'phone';
export type RelationType = 'owner' | 'tenant';
export type PaymentMethod = 'cash' | 'transfer' | 'bit' | 'paybox';

export interface ContactLink {
  id: number;
  type: ContactType;
  link: string;
}

/** The current user's own unit in the building (a building_users row). */
export interface Membership {
  apartment: number | null;
  floor: number | null;
  relationType: RelationType | null;
  sqrm: number | null;
  monthlyPayment: number | null;
  paymentMethod: PaymentMethod | null;
}

export type MembershipUpdate = Partial<Omit<Membership, 'monthlyPayment'>>;

/** Summary shape — what the building picker (GET /buildings) returns. */
export interface BuildingSummary {
  id: string;
  name: string;
  address: string;
  city: City;
}

/** Full shape for a building the user belongs to (me / join / membership update). */
export interface Building extends BuildingSummary {
  description: string | null;
  entryCode: string | null;
  contactLinks: ContactLink[];
  memberCount: number;
  membership: Membership | null;
}

export const MESSAGE_TYPES = ['general', 'urgent', 'maintenance'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export interface Message {
  id: string;
  buildingId: string;
  authorId: string;
  author: { id: string; name: string | null };
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
  isAdmin: boolean;
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

/** Role inside one building: management (committee head, management company — same level), then residents. */
export const BUILDING_ROLES = ['committee_head', 'management_company', 'resident'] as const;
export type BuildingRole = (typeof BUILDING_ROLES)[number];

export interface Member {
  userId: string;
  name: string | null;
  role: BuildingRole;
  apartment: number | null;
  floor: number | null;
  relationType: RelationType | null;
}

export interface Doc {
  id: string;
  buildingId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadDate: string;
  uploader: { id: string; name: string | null };
}

export interface ContactLinkInput {
  type: ContactType;
  link: string;
}
