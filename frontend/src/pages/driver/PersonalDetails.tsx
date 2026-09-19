import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import Select from "../../components/Select";
import OnboardingStepShell from "../../components/OnboardingStepShell";
import * as driverService from "../../services/driverService";
import { extractErrorMessage } from "../../services/api";
import { GENDERS } from "../../utils/constants";
import type { Gender } from "../../types/driver";

export default function PersonalDetails() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [nationality, setNationality] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    driverService
      .getMyProfile()
      .then((profile) => {
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");
        setGender(profile.gender ?? "");
        setNationality(profile.nationality ?? "");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleNext = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth || !gender) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await driverService.updateMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
        gender: gender as Gender,
        nationality: nationality.trim() || null,
      });
      navigate("/onboarding/contact");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <OnboardingStepShell
      title="Personal information"
      description="Tell us a bit about yourself."
      onNext={handleNext}
      onBack={() => navigate("/driver/dashboard")}
      isSubmitting={isSubmitting}
      error={error}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input
          label="Date of birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <Select
          label="Gender"
          placeholder="Select gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          options={GENDERS.map((g) => ({ value: g, label: g.replace(/_/g, " ") }))}
        />
        <Input
          label="Nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="sm:col-span-2"
        />
      </div>
    </OnboardingStepShell>
  );
}
