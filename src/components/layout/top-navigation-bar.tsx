
"use client";

import Link from 'next/link';
import { Dna } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function TopNavigationBar() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname(); 

  const sectionIds = ['imds', 'classification-systems'];

  const handleScroll = useCallback(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const navHeight = navElement.offsetHeight;
    const scrollY = window.scrollY;
    let currentActiveSection: string | null = null;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const sectionId = sectionIds[i];
      const section = document.getElementById(sectionId);
      if (section) {
        const sectionTop = section.offsetTop;
        if (sectionTop <= scrollY + navHeight + 50) { 
          currentActiveSection = sectionId;
          break; 
        }
      }
    }
    setActiveSection(currentActiveSection);
  }, []);

  const smoothScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = navRef.current ? navRef.current.offsetHeight : 0;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight - 10; 

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const determineInitialSection = () => {
      if (window.location.hash) {
        const hashId = window.location.hash.substring(1);
        if (sectionIds.includes(hashId)) {
          setActiveSection(hashId);
          setTimeout(() => {
            smoothScrollTo(hashId); 
            setTimeout(handleScroll, 350); 
          }, 150);
          return;
        }
      }
      handleScroll();
    };

    const initTimeout = setTimeout(() => {
      determineInitialSection();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
      document.fonts.ready.then(handleScroll); 
    }, 100); 

    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [pathname, handleScroll]); 

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setActiveSection(sectionId);
    smoothScrollTo(sectionId);
    if (history.pushState) {
      history.pushState(null, "", `#${sectionId}`);
    } else {
      window.location.hash = sectionId;
    }
  };

  return (
    <nav ref={navRef} className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Dna
              size={32}
              className="text-primary group-hover:opacity-80 transition-opacity"
            />
            <span className="hidden sm:inline font-semibold text-foreground group-hover:text-primary transition-colors">
              IMD Explorer
            </span>
          </Link>
          
          <div className="flex-grow flex justify-center items-center space-x-1 md:space-x-2 px-2">
            <Button 
              variant={activeSection === 'imds' ? 'secondary' : 'ghost'} 
              asChild 
              size="sm" 
              className="text-foreground hover:bg-accent hover:text-accent-foreground px-2 md:px-3 transition-colors text-xs md:text-sm"
            >
              <Link href="/#imds" onClick={(e) => handleNavClick(e, 'imds')}>
                <span className="hidden md:inline">Inherited Metabolic Disorders</span>
                <span className="md:hidden">IMDs</span>
              </Link>
            </Button>
            <Button 
              variant={activeSection === 'classification-systems' ? 'secondary' : 'ghost'} 
              asChild 
              size="sm" 
              className="text-foreground hover:bg-accent hover:text-accent-foreground px-2 md:px-3 transition-colors text-xs md:text-sm"
            >
              <Link href="/#classification-systems" onClick={(e) => handleNavClick(e, 'classification-systems')}>
                <span className="hidden md:inline">Classification Systems</span>
                <span className="md:hidden">Systems</span>
              </Link>
            </Button>
          </div>
          <div className="w-10 sm:w-32" />
        </div>
      </div>
    </nav>
  );
}
