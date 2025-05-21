import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { marked } from "marked";

// Props for the DocumentContent component
type DocumentContentProps = {
  documentTitle: string;
};

// Document response type from API
type DocumentResponse = {
  id: string;
  title: string;
  content: string;
  status: string;
};

const DocumentContent = ({ documentTitle }: DocumentContentProps) => {
  const { t } = useTranslation();
  
  // Fetch document content from API
  const { data, isLoading, isError } = useQuery<DocumentResponse>({
    queryKey: ['/api/docs', documentTitle],
    queryFn: () => fetch(`/api/docs/${encodeURIComponent(documentTitle)}`).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch document');
      }
      return res.json();
    })
  });

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-11/12" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Show error state if fetch fails
  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('Error')}</AlertTitle>
        <AlertDescription>
          {t('Failed to load document content. Please try again later.')}
        </AlertDescription>
      </Alert>
    );
  }

  // Configure Marked options for secure and proper rendering
  const configureMarked = () => {
    // Set marked options for security and proper rendering
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      headerIds: true, // Generate header IDs for linking
      mangle: false, // Don't mangle header IDs
      sanitize: false, // Sanitization is handled by DOMPurify (built into React)
    });
  };

  // Format and display document content using the marked library
  const formatContent = (content: string) => {
    // Configure marked options
    configureMarked();
    
    // Convert Markdown to HTML
    return marked.parse(content);
  };

  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <div 
        dangerouslySetInnerHTML={{ 
          __html: formatContent(data.content) 
        }} 
      />
    </article>
  );
};

export default DocumentContent;