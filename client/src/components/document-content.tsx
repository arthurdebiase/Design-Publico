import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  // Format and display document content with proper styling
  // Convert the raw content which might be Markdown to rendered HTML
  const formatContent = (content: string) => {
    // Basic Markdown-style links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const contentWithLinks = content.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert line breaks to <br> and paragraph breaks to paragraphs
    const withLineBreaks = contentWithLinks
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
      
    return withLineBreaks;
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