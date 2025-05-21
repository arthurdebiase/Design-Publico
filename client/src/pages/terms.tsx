import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import DocumentContent from "@/components/document-content";


const TermsPage = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <Helmet>
        <title>{t('Termos de Uso')} | Design Público</title>
        <meta name="description" content={t('Termos de Uso do Design Público')} />
      </Helmet>
      
      <div className="container mx-auto py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">{t('Termos de Uso')}</h1>
          
          <DocumentContent documentTitle="Termos de Uso" />
        </div>
      </div>
    </>
  );
};

export default TermsPage;