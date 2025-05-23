import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AppDetail from "@/pages/app-detail";
import ScreensPage from "@/pages/screens";
import About from "@/pages/about";
import CloudinaryAdmin from "@/pages/admin/cloudinary";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ScrollToTop from "@/components/scroll-to-top";
import MetaTags from "@/components/seo/meta-tags";
import { CriticalCSS } from "@/components/ui/critical-css";
import { ResourcePreloader } from "@/components/ui/resource-preloader";
import { ScriptOptimizer } from "@/components/ui/script-optimizer";
import { AccessibilityEnhancer } from "@/components/ui/accessibility-enhancer";
import { OptimizedImageLoader } from "@/components/ui/optimized-image-loader";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/aplicativos" component={Home} />
      <Route path="/app/:idOrSlug" component={AppDetail} />
      <Route path="/screens" component={ScreensPage} />
      <Route path="/about" component={About} />
      <Route path="/termos-de-uso">
        <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
          {React.createElement(React.lazy(() => import('./pages/terms')))}
        </Suspense>
      </Route>
      <Route path="/politica-de-privacidade">
        <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
          {React.createElement(React.lazy(() => import('./pages/privacy')))}
        </Suspense>
      </Route>
      <Route path="/admin/cloudinary" component={CloudinaryAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ScrollToTop>
          {/* Default SEO meta tags */}
          <MetaTags />
          {/* Gerenciamento de carregamento CSS não-crítico */}
          <CriticalCSS />
          {/* Pré-carregamento de recursos críticos */}
          <ResourcePreloader />
          {/* Otimização de carregamento de scripts */}
          <ScriptOptimizer />
          {/* Otimização de carregamento de imagens */}
          <OptimizedImageLoader imageSrcs={[]} />
          {/* Melhorias de acessibilidade */}
          <AccessibilityEnhancer />
          <div className="flex flex-col">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </ScrollToTop>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
