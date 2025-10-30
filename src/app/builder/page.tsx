import { FormBuilder } from "@/components/form-builder/form-builder";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <FormBuilder />
    </ProtectedRoute>
  );
}