import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import OnboardingStepShell from "../../components/OnboardingStepShell";
import * as driverService from "../../services/driverService";
import { extractErrorMessage } from "../../services/api";

export default function IdentityVerification() {
  const navigate = useNavigate();
  const [nationalId, setNationalId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    driverService
      .getMyProfile()
      .then((profile) => {
        setNationalId(profile.national_id_number ?? "");
        setLicenseNumber(profile.drivers_license_number ?? "");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleNext = async () => {
    setError(null);
    if (!nationalId.trim() || !licenseNumber.trim()) {
      setError("Please enter both identity numbers. You'll upload the supporting documents shortly.");
      return;
    }
    setIsSubmitting(true);
    try {
      await driverService.updateMyProfile({
        national_id_number: nationalId.trim(),
        drivers_license_number: licenseNumber.trim(),
      });
      navigate("/onboarding/vehicle");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <OnboardingStepShell
      title="Identity verification"
      description="We use this to verify your identity against the documents you'll upload later."
      onNext={handleNext}
      onBack={() => navigate("/onboarding/contact")}
      isSubmitting={isSubmitting}
      error={error}
    >
      <Input label="National ID number" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
      <Input
        label="Driver's licence number"
        value={licenseNumber}
        onChange={(e) => setLicenseNumber(e.target.value)}
      />
    </OnboardingStepShell>
  );
}
