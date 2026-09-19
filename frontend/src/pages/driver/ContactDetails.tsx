import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import OnboardingStepShell from "../../components/OnboardingStepShell";
import * as driverService from "../../services/driverService";
import { extractErrorMessage } from "../../services/api";

export default function ContactDetails() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    driverService
      .getMyProfile()
      .then((profile) => {
        setAddress(profile.address ?? "");
        setCity(profile.city ?? "");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleNext = async () => {
    setError(null);
    if (!address.trim() || !city.trim()) {
      setError("Please fill in your address and city.");
      return;
    }
    setIsSubmitting(true);
    try {
      await driverService.updateMyProfile({ address: address.trim(), city: city.trim() });
      navigate("/onboarding/identity");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <OnboardingStepShell
      title="Contact & address"
      description="Where can we reach you and where are you based?"
      onNext={handleNext}
      onBack={() => navigate("/onboarding/personal")}
      isSubmitting={isSubmitting}
      error={error}
    >
      <Input label="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
    </OnboardingStepShell>
  );
}
