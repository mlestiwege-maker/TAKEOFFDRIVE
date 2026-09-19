import { useNavigate } from "react-router-dom";
import DocumentsStepBase from "./DocumentsStepBase";

export default function DriverDocuments() {
  const navigate = useNavigate();
  return (
    <DocumentsStepBase
      title="Driver documents"
      description="Upload a clear photo or scan of your ID and driver's licence."
      documentTypes={["NATIONAL_ID", "DRIVERS_LICENSE"]}
      onBack={() => navigate("/onboarding/vehicle")}
      onNext={() => navigate("/onboarding/vehicle-documents")}
    />
  );
}
