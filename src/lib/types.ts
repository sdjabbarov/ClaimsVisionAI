export interface MarkerPosition {
  x: number; // 0–100, percent of image width
  y: number; // 0–100, percent of image height
}

export interface BoundingBox {
  x: number; // 0–100, percent of image width (top-left corner)
  y: number; // 0–100, percent of image height (top-left corner)
  width: number; // 0–100, percent of image width
  height: number; // 0–100, percent of image height
}

export interface Damage {
  type: string;
  location: string;
  severity: string;
  estimatedCost: number;
  markerPosition?: MarkerPosition; // Legacy support
  boundingBox?: BoundingBox; // New rectangle selection
}

export interface AIAssessment {
  confidenceScore: number;
  totalEstimatedCost: number;
  damages: Damage[];
  isTotalLoss?: boolean; // True if vehicle is deemed a total loss
  totalLossValue?: number; // Vehicle value when marked as total loss
  totalLossReason?: string; // Reason why AI marked it as total loss
}

export type ClaimStatus =
  | "Pending Review"
  | "Pending - Returned for Update"
  | "Awaiting approval"
  | "Escalated";

export type EstimateSource =
  | "AI only"
  | "Edited by claims agent"
  | "Claims agent only";

export interface VehicleDetails {
  licensePlate: string;
  vin: string;
  make: string;
  model: string;
  year: number;
}

export interface DriverLicense {
  number: string;
  state: string;
}

export interface PolicyInfo {
  policyNumber: string;
  vehicleDetails: VehicleDetails;
  driverName: string;
  driverContact: string;
  driverLicense: DriverLicense;
  wasPolicyholderDriving: string;
  estimatedVehicleValue?: number;
  totalLossThreshold?: number; // Percentage (e.g., 0.75 = 75%)
}

export interface IncidentDetails {
  dateTime: string;
  location: string;
  description: string;
  type: string; // Collision, Weather Damage, Theft, etc.
  speedOfTravel: string;
}

export interface OtherParty {
  name: string;
  contact: string;
  policyNumber: string;
  vehicleDetails: string;
}

export interface PoliceReport {
  reportNumber: string;
  wasPoliceCalled: string;
}

export interface DamageDetails {
  description: string;
  isDrivable: string;
  personalPropertyDamaged: string;
  priorExistingDamage: string;
}

export interface RepairInfo {
  preferredShop: string;
  estimatesObtained: string;
  towingReceipts: string;
  rentalCarNeeds: string;
}

export interface InjuryInfo {
  wasAnyoneInjured: string;
  injuryDescription: string;
  medicalProvider: string;
}

export interface TheftInfo {
  proofOfOwnership: string;
  stolenItems: string;
  spareKeyConfirmation: string;
}

export interface Claim {
  id: string;
  policyInfo: PolicyInfo;
  incidentDetails: IncidentDetails;
  otherParties: OtherParty[];
  policeReport: PoliceReport;
  damageDetails: DamageDetails;
  repairInfo: RepairInfo;
  injuryInfo: InjuryInfo;
  theftInfo: TheftInfo;
  status: ClaimStatus;
  vehicleImageUrl: string;
  annotatedVehicleImageUrl?: string;
  agentAnnotatedImageUrl?: string; // Saved annotated image from agent edits
  aiAssessment: AIAssessment;
  originalAIAssessment?: AIAssessment; // Store original AI assessment for revert
  estimateSource: EstimateSource;
  // Legacy fields for backward compatibility
  policyholder?: string;
  claimDate?: string;
}
