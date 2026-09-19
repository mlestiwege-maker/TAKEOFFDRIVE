import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import OnboardingStepShell from "../../components/OnboardingStepShell";
import * as vehicleService from "../../services/vehicleService";
import { extractErrorMessage } from "../../services/api";
import { VEHICLE_TYPES } from "../../utils/constants";
import { titleCase } from "../../utils/formatters";
import type { Vehicle, VehicleType } from "../../types/vehicle";

const EMPTY_FORM = { vehicleType: "" as VehicleType | "", registration: "", make: "", model: "", year: "", colour: "" };

export default function VehicleDetails() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => vehicleService.listVehicles().then(setVehicles);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  const handleAddVehicle = async () => {
    setError(null);
    const { vehicleType, registration, make, model, year, colour } = form;
    if (!vehicleType || !registration.trim() || !make.trim() || !model.trim() || !year || !colour.trim()) {
      setError("Please fill in all vehicle details.");
      return;
    }
    setIsAdding(true);
    try {
      await vehicleService.addVehicle({
        vehicle_type: vehicleType as VehicleType,
        registration_number: registration.trim(),
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        colour: colour.trim(),
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    setError(null);
    try {
      await vehicleService.deleteVehicle(id);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleNext = async () => {
    setError(null);
    if (vehicles.length === 0) {
      setError("Please add at least one vehicle before continuing.");
      return;
    }
    setIsSubmitting(true);
    try {
      navigate("/onboarding/driver-documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <OnboardingStepShell
      title="Vehicle information"
      description="Add the vehicle(s) you'll use for deliveries — you can add more than one."
      onNext={handleNext}
      onBack={() => navigate("/onboarding/identity")}
      isSubmitting={isSubmitting}
      error={error}
    >
      {vehicles.length > 0 && (
        <div className="flex flex-col gap-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {v.make} {v.model} ({v.year})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {titleCase(v.vehicle_type)} · {v.registration_number} · {v.colour}
                </p>
              </div>
              <button
                onClick={() => handleRemove(v.id)}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {vehicles.length > 0 ? "Add another vehicle" : "Add a vehicle"}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Vehicle type"
            placeholder="Select vehicle type"
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}
            options={VEHICLE_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
          />
          <Input
            label="Registration number"
            value={form.registration}
            onChange={(e) => setForm({ ...form, registration: e.target.value })}
          />
          <Input label="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
          <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input
            label="Year"
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
          <Input label="Colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
        </div>
        <Button
          variant="secondary"
          className="mt-4 w-full sm:w-auto"
          onClick={handleAddVehicle}
          isLoading={isAdding}
          type="button"
        >
          + Add vehicle
        </Button>
      </div>
    </OnboardingStepShell>
  );
}
