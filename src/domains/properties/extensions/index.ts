/**
 * Property market extensions — typed bags, enums, localized text.
 */

export {
  UAE_FURNISHING,
  UAE_VIEW_TYPE,
  UAE_PARKING_TYPE,
  UAE_PERMIT_KINDS,
  type UaeFurnishing,
  type UaeViewType,
  type UaeParkingType,
  type UaePermitKind,
} from "./enums/ae";

export {
  ES_ENERGY_CERTIFICATE,
  ES_ORIENTATION,
  ES_HEATING_TYPE,
  type EsEnergyCertificate,
  type EsOrientation,
  type EsHeatingType,
} from "./enums/es";

export {
  CZ_PENB_CLASS,
  CZ_BALCONY_KIND,
  type CzPenbClass,
  type CzBalconyKind,
} from "./enums/cz";

export {
  uaePropertyAttributesSchema,
  parseUAEPropertyAttributes,
  type UAEPropertyAttributes,
} from "./schemas/uae";

export {
  spainPropertyAttributesSchema,
  parseSpainPropertyAttributes,
  type SpainPropertyAttributes,
} from "./schemas/spain";

export {
  czechPropertyAttributesSchema,
  parseCzechPropertyAttributes,
  type CzechPropertyAttributes,
} from "./schemas/czech";

export {
  MarketExtensionError,
  supportsTypedExtensions,
  getExtensionSchema,
  parseMarketExtensions,
  serializeMarketExtensions,
  type MarketPropertyAttributes,
  type ExtensionMarketCode,
} from "./registry";

export {
  PROPERTY_TEXT_FIELDS,
  TRANSLATION_SOURCES,
  LocalizedTextError,
  createLocalizedPropertyText,
  pickDisplayText,
  type PropertyTextField,
  type TranslationSource,
  type LocalizedPropertyText,
  type LocalizedPropertyTextInput,
} from "./text/localized-text";
