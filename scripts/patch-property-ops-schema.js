const fs = require("fs");
const p = "c:/Users/HP/OneDrive/Desktop/majetio.cz/prisma/schema.prisma";
let t = fs.readFileSync(p, "utf8");

const marker = "model PropertyFieldOverride {";
const idx = t.indexOf(marker);
if (idx < 0) {
  console.error("PropertyFieldOverride not found");
  process.exit(1);
}
const endMarker = "\n// ─── Import jobs (Prompt 7 Part 4)";
const endIdx = t.indexOf(endMarker, idx);
if (endIdx < 0) {
  console.error("end marker not found");
  process.exit(1);
}

const replacement = `model PropertyFieldOverride {
  id          String                     @id @default(cuid())
  propertyId  String
  fieldKey    String
  value       String                     @db.Text
  valueType   PropertyAttributeValueType @default(STRING)
  locked      Boolean                    @default(true)
  reason      String?
  /** Manual ops tag — UI shows "Manuálně upraveno". */
  manualTag   Boolean                    @default(true)
  /** Optional expiry — after this, override is ignored by resolve. */
  expiresAt   DateTime?
  createdById String?
  updatedById String?
  createdAt   DateTime                   @default(now())
  updatedAt   DateTime                   @updatedAt

  property  Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  createdBy User?    @relation("FieldOverrideCreator", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?    @relation("FieldOverrideUpdater", fields: [updatedById], references: [id], onDelete: SetNull)

  @@unique([propertyId, fieldKey])
  @@index([locked])
  @@index([expiresAt])
}

/**
 * Non-destructive merge audit — foundation for undo/revert.
 */
model PropertyMergeEvent {
  id                    String    @id @default(cuid())
  candidateId           String?
  canonicalPropertyId   String
  secondaryPropertyId   String
  /** MergePlan JSON (resolutions, locked fields). */
  planJson              Json
  /** Secondary property field snapshot before merge (for revert). */
  secondarySnapshot     Json
  /** Secondary status before merge. */
  secondaryPriorStatus  String
  reversedAt            DateTime?
  reversedByUserId      String?
  createdByUserId       String?
  createdAt             DateTime  @default(now())

  @@index([canonicalPropertyId, createdAt])
  @@index([secondaryPropertyId])
  @@index([candidateId])
}

`;

t = t.slice(0, idx) + replacement + t.slice(endIdx);
fs.writeFileSync(p, t);
console.log("OK patched PropertyFieldOverride + PropertyMergeEvent");
