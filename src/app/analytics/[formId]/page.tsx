import { FormAnalytics } from "@/components/analytics/form-analytics";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface AnalyticsPageProps {
  params: Promise<{
    formId: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { formId } = await params;
  
  return (
    <ProtectedRoute>
      <FormAnalytics formId={formId} />
    </ProtectedRoute>
  );
}