import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Layers, Monitor, Smartphone } from "lucide-react";
import { App } from "@/types";

export default function About() {
  const { t } = useTranslation();

  // Fetch all apps to count them and their screens
  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ['/api/apps'],
    // The QueryClient default settings will handle the request
  });

  // Calculate total screens across all apps
  const totalScreens = apps.reduce((sum, app) => sum + app.screenCount, 0);
  const totalApps = apps.length;

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
            <p className="text-xl text-gray-600 mb-12">
              {t('about.description')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Monitor className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalApps}</span>
                <p className="text-gray-600">{t('about.stats.apps')}</p>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Layers className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalScreens}</span>
                <p className="text-gray-600">{t('about.stats.screens')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project description section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">{t('about.projectTitle')}</h2>
            <div className="prose prose-lg mx-auto">
              <p>
                DESIGN PÚBLICO is a comprehensive catalog of design examples from public applications across various platforms.
                Our mission is to serve as a valuable reference tool for designers and developers who want to create accessible
                and user-friendly digital experiences.
              </p>
              <p>
                As governments and institutions worldwide embrace digital transformation, there is an increasing need for
                well-designed interfaces that prioritize user experience. This repository showcases best practices and
                design patterns from successful public sector applications.
              </p>
              <p>
                The collection focuses on applications that excel in:
              </p>
              <ul>
                <li>Accessibility and inclusive design</li>
                <li>Clear information architecture</li>
                <li>Intuitive navigation</li>
                <li>Responsive layouts for all devices</li>
                <li>Consistent visual language</li>
              </ul>
              <p>
                Whether you're a designer, developer, or public sector professional, we hope this resource provides
                inspiration and reference for your digital projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">{t('about.platformsTitle')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                  <Smartphone className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.platforms.mobile.title')}</h3>
                <p className="text-gray-600">
                  {t('about.platforms.mobile.description')}
                </p>
              </div>
              
              <div className="p-6">
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                  <Monitor className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.platforms.web.title')}</h3>
                <p className="text-gray-600">
                  {t('about.platforms.web.description')}
                </p>
              </div>
              
              <div className="p-6">
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                  <Layers className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.platforms.cross.title')}</h3>
                <p className="text-gray-600">
                  {t('about.platforms.cross.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}