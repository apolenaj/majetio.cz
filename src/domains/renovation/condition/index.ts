export {
  CONDITION_AREAS,
  CONDITION_STATUSES,
  CONDITION_ASSESSMENT_SOURCES,
  PROPERTY_CONDITIONS,
  type ConditionArea,
  type ConditionAreaStatus,
  type ConditionAssessmentSource,
  type PropertyCondition,
  type ConditionAreaAssessment,
  type RenovationConditionAssessment,
  type ConditionPropertyInput,
  type ConditionService,
} from "./types";

export { CONDITION_MODEL_VERSION, assessCondition } from "./assess";
export { createConditionService } from "./service";
