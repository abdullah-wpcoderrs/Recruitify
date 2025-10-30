import { PublicForm } from "@/components/public-form/public-form";
import { getForm } from "@/lib/database";
import { notFound } from "next/navigation";

interface PublicFormPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface FormData {
  is_published: boolean;
  title: string;
  description?: string;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { id } = await params;
  const { data: form, error } = await getForm(id);

  if (error || !form || !(form as unknown as FormData).is_published) {
    notFound();
  }

  return <PublicForm form={form} />;
}

export async function generateMetadata({ params }: PublicFormPageProps) {
  const { id } = await params;
  const { data: form } = await getForm(id);

  if (!form) {
    return {
      title: 'Form Not Found',
    };
  }

  const formData = form as unknown as FormData;
  return {
    title: formData.title,
    description: formData.description || `Fill out the ${formData.title} form`,
  };
}