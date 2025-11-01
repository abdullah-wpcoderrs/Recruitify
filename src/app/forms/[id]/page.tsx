import { PublicForm } from "@/components/public-form/public-form";
import { getForm } from "@/lib/database";
import { notFound } from "next/navigation";

interface PublicFormPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
}

interface FormData {
  is_published: boolean;
  title: string;
  description?: string;
}

export default async function PublicFormPage({ params, searchParams }: PublicFormPageProps) {
  const { id } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === 'true';
  
  const { data: form, error } = await getForm(id);

  if (error || !form) {
    notFound();
  }

  // Allow access to unpublished forms only in preview mode
  const formData = form as unknown as FormData;
  if (!formData.is_published && !isPreview) {
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