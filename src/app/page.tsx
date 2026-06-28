import { HubApp } from "@/components/hub/HubApp";
import { HubFooter } from "@/components/hub/HubFooter";
import { LicenseGate } from "@/components/hub/LicenseGate";

export default function Page() {
  return (
    <LicenseGate>
      <div className="relative h-screen w-screen overflow-hidden">
        <HubApp />
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6">
          <HubFooter />
        </div>
      </div>
    </LicenseGate>
  );
}
