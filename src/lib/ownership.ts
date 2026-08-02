import { prisma } from "@/lib/db";

export function getOwnedApartment(id: string, ownerId: string) {
  return prisma.apartment.findFirst({ where: { id, ownerId } });
}
