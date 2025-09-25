
"use client"; 

import { useState, useCallback } from 'react';
import type { ImdStats } from '@/types';
import { ImdList } from '@/components/imd/imd-list';
import { ClassificationInfo } from '@/components/classification/classification-info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart3 } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState<ImdStats>({ categoryCount: 0, imdCount: 0, recruitedPatientCount: 0 });

  const handleStatsUpdate = useCallback((newStats: ImdStats) => {
    setStats(newStats);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <header className="relative mb-12 text-center pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 rounded-xl overflow-hidden">
          <div
            className="absolute inset-0 z-0 filter blur-md"
            style={{
              backgroundImage: `url("/bg.PNG")`,
              backgroundSize: 'cover',
            }}
          />
          <div className="absolute inset-0 z-10 bg-black/50"></div>
          <div className="relative z-20 px-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white mb-6">
              Diseases
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
              The project will include <strong>{stats.imdCount}</strong> diseases that were stratified into <strong>{stats.categoryCount}</strong> subgroups according to the ICIMD nosology.
            </p>
            { (stats.categoryCount > 0 && stats.imdCount > 0) && (
              <div className="mt-6 p-4 bg-black/40 backdrop-blur-sm rounded-lg inline-flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-base text-gray-200 shadow-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                <span>
                  Categories: <strong className="text-primary-foreground font-semibold">{stats.categoryCount}</strong>
                </span>
                <Separator orientation="vertical" className="h-5 sm:h-6 bg-gray-500/50" />
                <span>
                  IMDs: <strong className="text-primary-foreground font-semibold">{stats.imdCount}</strong>
                </span>
                {(stats.recruitedPatientCount ?? 0) > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-5 sm:h-6 bg-gray-500/50" />
                    <span>
                      Recruited Patients: <strong className="text-primary-foreground font-semibold">{stats.recruitedPatientCount}</strong>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="space-y-12">
          <section id="imds" aria-labelledby="imd-section-title">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-card-foreground/5">
                <CardTitle id="imd-section-title" className="text-2xl sm:text-3xl font-semibold">Inherited Metabolic Disorders</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Browse IMDs grouped by their ICIMD major categories.
                  Use the search below to filter by name, gene, or IEM code. Click on an IMD name for more details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ImdList onStatsUpdate={handleStatsUpdate} />
              </CardContent>
            </Card>
          </section>

          <Separator className="my-10" />

          <section id="classification-systems" aria-labelledby="classification-section-title">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-card-foreground/5">
                <CardTitle id="classification-section-title" className="text-2xl sm:text-3xl font-semibold">Classification Systems</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Discover information and resources for various classification systems relevant to metabolic disorders.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ClassificationInfo />
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
