import { useNavigate } from "react-router-dom";
import DocumentsStepBase from "./DocumentsStepBase";

export default function VehicleDocuments() {
  const navigate = useNavigate();
  return (
    <DocumentsStepBase
      title="Vehicle documents"
      description="Upload your vehicle registration and insurance documents."
      documentTypes={["VEHICLE_REGISTRATION", "VEHICLE_INSURANCE"]}
      onBack={() => navigate("/onboarding/driver-documents")}
      onNext={() => navigate("/onboarding/review")}
      nextLabel="Review application"
    />
  );
}
