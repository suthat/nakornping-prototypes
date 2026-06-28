import { HubApp } from "@/components/hub/HubApp";
import { LicenseGate } from "@/components/hub/LicenseGate";

export default function Page() {
  return (
    <LicenseGate>
      <HubApp />
    </LicenseGate>
  );
}
