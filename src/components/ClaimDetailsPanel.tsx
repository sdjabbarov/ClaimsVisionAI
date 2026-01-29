"use client";

import type { Claim } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface ClaimDetailsPanelProps {
  claim: Claim;
}

function formatDateTime(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTime;
  }
}

export function ClaimDetailsPanel({ claim }: ClaimDetailsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Policy Information */}
      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Policy Information
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Policy Number
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policyInfo.policyNumber}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Driver Name
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policyInfo.driverName}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Contact
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policyInfo.driverContact}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Driver License
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policyInfo.driverLicense.number} ({claim.policyInfo.driverLicense.state})
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Policyholder Driving
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policyInfo.wasPolicyholderDriving}
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Vehicle Details
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Make/Model: </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {claim.policyInfo.vehicleDetails.make} {claim.policyInfo.vehicleDetails.model}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Year: </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {claim.policyInfo.vehicleDetails.year}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">License Plate: </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {claim.policyInfo.vehicleDetails.licensePlate}
              </span>
            </div>
            <div className="col-span-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">VIN: </span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">
                {claim.policyInfo.vehicleDetails.vin}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Incident Details */}
      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Incident Details
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Incident Type
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {claim.incidentDetails.type}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Date & Time
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDateTime(claim.incidentDetails.dateTime)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Speed of Travel
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.incidentDetails.speedOfTravel}
            </p>
          </div>
          <div className="col-span-full">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Location
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.incidentDetails.location}
            </p>
          </div>
          <div className="col-span-full">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Description
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.incidentDetails.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Other Parties */}
      {claim.otherParties.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Other Parties ({claim.otherParties.length})
          </h3>
          <div className="space-y-3">
            {claim.otherParties.map((party, i) => (
              <div
                key={i}
                className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Name: </span>
                    <span className="text-sm text-gray-900 dark:text-white">{party.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Contact: </span>
                    <span className="text-sm text-gray-900 dark:text-white">{party.contact}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Policy: </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {party.policyNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Vehicle: </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {party.vehicleDetails}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Police Report */}
      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Police Report
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Police Called
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.policeReport.wasPoliceCalled}
            </p>
          </div>
          {claim.policeReport.reportNumber !== "N/A" && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Report Number
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.policeReport.reportNumber}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Damage Details */}
      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Damage Details
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Description
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.damageDetails.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Drivable
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.damageDetails.isDrivable}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Personal Property Damaged
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.damageDetails.personalPropertyDamaged}
              </p>
            </div>
            <div className="col-span-full">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Prior Existing Damage
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.damageDetails.priorExistingDamage}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Repair Info */}
      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Repair Information
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Preferred Shop
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.repairInfo.preferredShop !== "N/A"
                ? claim.repairInfo.preferredShop
                : "None specified"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Estimates Obtained
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.repairInfo.estimatesObtained}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Towing Receipts
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.repairInfo.towingReceipts}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Rental Car Needs
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {claim.repairInfo.rentalCarNeeds}
            </p>
          </div>
        </div>
      </Card>

      {/* Injury Info */}
      {claim.injuryInfo.wasAnyoneInjured === "Yes" && (
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Injury Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Anyone Injured
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.injuryInfo.wasAnyoneInjured}
              </p>
            </div>
            {claim.injuryInfo.medicalProvider !== "N/A" && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Medical Provider
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {claim.injuryInfo.medicalProvider}
                </p>
              </div>
            )}
            {claim.injuryInfo.injuryDescription !== "N/A" && (
              <div className="col-span-full">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Injury Description
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {claim.injuryInfo.injuryDescription}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Theft Info */}
      {claim.theftInfo.proofOfOwnership !== "N/A" && (
        <Card className="p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Theft Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Proof of Ownership
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {claim.theftInfo.proofOfOwnership}
              </p>
            </div>
            {claim.theftInfo.stolenItems !== "N/A" && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Stolen Items
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {claim.theftInfo.stolenItems}
                </p>
              </div>
            )}
            {claim.theftInfo.spareKeyConfirmation !== "N/A" && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Spare Key Confirmation
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {claim.theftInfo.spareKeyConfirmation}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
