import { BadRequestException } from '@nestjs/common';
import type { ContactLinkDto } from '../admin/dto/building.dto.js';

/** Validates a contact link for its type and returns the cleaned value. */
export function normalizeContactLink({ type, link }: ContactLinkDto): ContactLinkDto {
  const value = link.trim();
  if (type === 'whatsapp') {
    let url: URL | null = null;
    try {
      url = new URL(value);
    } catch {
      // not a URL — rejected below
    }
    if (url?.protocol !== 'https:') throw new BadRequestException('WhatsApp link must be an https:// invite link');
  } else if (type === 'phone') {
    if (!/^\+?[\d\s\-()]{6,20}$/.test(value)) throw new BadRequestException('Invalid phone number');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new BadRequestException('Invalid email address');
  }
  return { type, link: value };
}
