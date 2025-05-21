import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import DocumentContent from "@/components/document-content";
const PrivacyPage = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <Helmet>
        <title>{t('Política de Privacidade')} | Design Público</title>
        <meta name="description" content={t('Política de Privacidade do Design Público')} />
      </Helmet>
      
      <div className="container mx-auto py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">{t('Política de Privacidade')}</h1>
          
          <DocumentContent documentTitle="Política de Privacidade" />
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;