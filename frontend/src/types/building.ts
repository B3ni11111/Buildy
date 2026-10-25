export interface City {
  id: number;
  name: string;
}

export type ContactType = 'email' | 'whatsapp' | 'phone';
/** `tenant` = renter. */
export type RelationType = 'owner' | 'tenant';
/** Bit and PayBox count as one method. */
export const PAYMENT_METHODS = ['card', 'cash', 'transfer', 'bit_paybox'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  id: number;
  number: number;
  floor: number | null;
  sqrm: number | null;
  monthlyPayment: number | null;
  paymentMethod: PaymentMethod | null;
  relationType: RelationType;
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
}

export const ISSUE_STATUSES = ['opened', 'in_process', 'denied', 'resolved'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/** A picture or file on an issue (the file itself is fetched with the auth header). */
export interface IssueAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploader: { id: string; name: string | null } | null;
}

/** One status change by building management, with its required note. */
export interface IssueUpdate {
  id: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null } | null;
  attachments: IssueAttachment[];
  /** Set (to the end of the 5-minute undo window) only on the viewer's own newest update. */
  undoableUntil?: string | null;
}

/** What the viewer took back with Undo: their note and files, to edit and send again. */
export interface IssueDraft {
  text: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  attachments: IssueAttachment[];
}

export interface Issue {
  id: string;
  buildingId: string;
  /** null = the author deleted their account ("Former resident"). */
  author: { id: string; name: string | null } | null;
  title: string;
  description: string | null;
  status: IssueStatus;
  createdAt: string;
  statusChangedAt: string;
  lastPingedAt: string | null;
  /** In the list: the first few pictures of the report, for small previews. */
  attachments?: Pick<IssueAttachment, 'id' | 'fileName' | 'mimeType'>[];
  /** Pinged within the last week. */
  pingedRecently: boolean;
  /** For the author of an active issue: when they may ping it next (may be in the past = now). */
  canPingAt: string | null;
  _count: { attachments: number; updates: number };
}

/** An issue with its report files and status timeline (GET /issues/:id). */
export interface IssueDetail extends Issue {
  attachments: IssueAttachment[];
  updates: IssueUpdate[];
  draft?: IssueDraft | null;
}

/** The signed-in user as the backend sees them (GET /users/me). */
export interface CurrentUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
  /** Finished onboarding at some point (on any device). */
  onboarded: boolean;
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
  _count: { members: number; issues: number; docs: number };
  /** The admin viewing the console is a member (the list sends it; create/update responses don't). */
  joined?: boolean;
}

export interface BuildingInput {
  name: string;
  cityId: number;
  address: string;
  description?: string | null;
  entryCode?: string | null;
  contactLinks?: ContactLinkInput[];
  /** First residents, added by their user IDs. */
  residents?: ResidentInput[];
  /** The wizard's payments step. */
  payments?: PaymentSettings;
}

/** Someone management adds by their user ID, with their apartments. */
export interface ResidentInput {
  userId: string;
  apartments: ApartmentInput[];
}

/** What building management sees for a pasted user ID before adding them. */
export interface UserPreview {
  userId: string;
  name: string | null;
  picture: Picture;
  isMe: boolean;
  alreadyMember: boolean;
  blocked: boolean;
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

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

export type PaymentConfirmation = 'single' | 'bulk' | 'self' | 'automatic';
export type PaymentsOpenMode = 'manual' | 'auto';

/** A building's payments setup. */
export interface PaymentSettings {
  openMode: PaymentsOpenMode;
  /** Day of the month (1-28) an automatic month opens. */
  openDay: number;
  /** Fee of every apartment that has none of its own. */
  defaultFee: number | null;
  defaultMethod: PaymentMethod | null;
}

/** One apartment's charge for a month. */
export interface PaymentCharge {
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  method?: PaymentMethod | null;
}

export interface PersonRef {
  id: string;
  name: string | null;
}

/** One row of a payments log (building-wide for management, one apartment for a resident). */
export interface PaymentLogRow {
  id: string;
  /** The period it is for: YYYY-MM (or a full time in test mode). */
  period: string;
  apartmentNumber: number;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  paidBy: PersonRef | null;
  confirmedBy: PersonRef | null;
  confirmation: PaymentConfirmation | null;
  method: PaymentMethod | null;
}

/** The month's budget for building management (GET /buildings/:id/manage/payments). */
export interface PaymentsOverview {
  /** YYYY-MM (or a full time in the dev-only 5-minute test mode). */
  month: string;
  /** null = payments aren't set up yet. */
  settings: PaymentSettings | null;
  /** Management has opened the month (created the charges). */
  opened: boolean;
  /** Apartments without a charge yet (added after the month was opened). */
  missing: number;
  goal: number;
  collected: number;
  /** collected === goal (and there is something to collect). */
  complete: boolean;
  apartments: {
    apartmentId: number;
    number: number;
    floor: number | null;
    sqrm: number | null;
    /** The standing monthly fee that future months copy (its own, else the building's default). */
    fee: number;
    /** Pre-selected method when marking it paid. */
    method: PaymentMethod;
    /** Who pays (chosen by an owner; an owner by default). */
    payer: PersonRef | null;
    residents: { userId: string; name: string | null; relationType: RelationType }[];
    /** null = no charge for this apartment this month yet. */
    payment: PaymentCharge | null;
  }[];
}

/** A resident's own part (GET /buildings/:id/payments/mine). */
export interface MyPayments {
  month: string;
  apartments: {
    apartmentId: number;
    number: number;
    relationType: RelationType;
    payer: PersonRef | null;
    /** Only the payer gets the Pay button. */
    isPayer: boolean;
    /** Owners choose who pays. */
    canChoosePayer: boolean;
    residents: { userId: string; name: string | null; relationType: RelationType }[];
    payment: PaymentCharge | null;
  }[];
  history: { period: string; apartmentNumber: number; amount: number; status: PaymentStatus; paidAt: string | null }[];
}

export type FeeScope = 'once' | 'permanent';

export interface ContactLinkInput {
  type: ContactType;
  link: string;
}
