
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import type { IMD, OrderedGroupedIMD, ImdStats } from '@/types';
import { ICIMD_CATEGORY_NAMES_ORDERED, UNCATEGORIZED_GROUP_NAME } from '@/data/icimd-categories';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, ExternalLink, Search, Dna, ListChecks, Hash, FileText, Users, Check, X, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";


//Replace with your actual CSV file paths
//imd_info: dictionary of all IMDs with their details
//imd_recruitment_plan: which IMDs are in the recruitment plan, their status, collaborators, and target sizes
//recruited_imds_dashboard: list of all recruited patients with their IEMNosologyCode
const CSV_PATH_IMD_INFO = '/info.csv';
const CSV_PATH_RECRUITMENT_PLAN = '/recruitment_plan.csv';
const CSV_PATH_RECRUITED_IMDS = '/recruited.csv';

const SHOW_ALL_COLLABORATORS = "Show All Collaborators";

interface ImdListProps {
  onStatsUpdate?: (stats: ImdStats) => void;
}

interface RecruitmentPlanEntry {
  GeneSymbol?: string;
  IMDstatus?: string;
  minGroupSize?: string;
  Collaborators?: string;
}

interface RecruitedImdEntry {
  IEMNosologyCode?: string;
  [key: string]: any;
}

export function ImdList({ onStatsUpdate }: ImdListProps) {
  const [rawImds, setRawImds] = useState<IMD[]>([]);
  const [isLoadingImds, setIsLoadingImds] = useState(true);
  const [errorImds, setErrorImds] = useState<string | null>(null);

  const [recruitmentPlanData, setRecruitmentPlanData] = useState<RecruitmentPlanEntry[]>([]);
  const [isLoadingRecruitment, setIsLoadingRecruitment] = useState(true);
  const [errorRecruitment, setErrorRecruitment] = useState<string | null>(null);

  const [recruitedImdsRawData, setRecruitedImdsRawData] = useState<RecruitedImdEntry[]>([]);
  const [isLoadingRecruitedImds, setIsLoadingRecruitedImds] = useState(true);
  const [errorRecruitedImds, setErrorRecruitedImds] = useState<string | null>(null);
  const [recruitedCountsByIemCode, setRecruitedCountsByIemCode] = useState<Record<string, number>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [allCollaborators, setAllCollaborators] = useState<string[]>([SHOW_ALL_COLLABORATORS]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>(SHOW_ALL_COLLABORATORS);
  
  const [displayedOrderedGroupedImds, setDisplayedOrderedGroupedImds] = useState<OrderedGroupedIMD[]>([]);

  const [statusFilter, setStatusFilter] = useState({ prescribed: true, flexible: true });

  const toggleStatusFilter = (status: "prescribed" | "flexible") => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
  };

  useEffect(() => {
    async function fetchImdData() {
      setIsLoadingImds(true);
      setErrorImds(null);
      try {
        const response = await fetch(CSV_PATH_IMD_INFO);
        if (!response.ok) {
          throw new Error(`Failed to fetch IMD info CSV: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        
        Papa.parse<Record<string, any>>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              const errorMessages = results.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ');
              setErrorImds(`Error parsing IMD info CSV: ${errorMessages}`);
            } else if (results.data.length === 0) {
              setErrorImds("IMD info CSV file is empty or contains no data rows.");
            } else {
              const mappedData: IMD[] = results.data
                .map(item => {
                  let icimdCategoryName = UNCATEGORIZED_GROUP_NAME;
                  if (item.ICIMDNosologyNumber) {
                    const majorGroupStr = String(item.ICIMDNosologyNumber).split('.')[0];
                    const majorGroupNum = parseInt(majorGroupStr, 10);
                    if (!isNaN(majorGroupNum) && majorGroupNum > 0 && majorGroupNum <= ICIMD_CATEGORY_NAMES_ORDERED.length) {
                      icimdCategoryName = ICIMD_CATEGORY_NAMES_ORDERED[majorGroupNum - 1];
                    }
                  }
                  return {
                    name: item.Name,
                    alternativeName: item.AlternativeNames,
                    diseaseAbbreviation: item.DiseaseAbbreviation, 
                    icimdNosologyNumber: item.ICIMDNosologyNumber,
                    icimdCategoryName: icimdCategoryName,
                    iemBaseId: item.IEMBase_ID,
                    geneSymbol: item.GeneSymbol,
                    iemNosologyCode: item.IEMNosologyCode,
                    omimId: item.OMIM,
                  };
                })
                .filter(item => item.name && item.icimdNosologyNumber);

              if (mappedData.length === 0) {
                setErrorImds("No valid IMD entries found in IMD_info.csv. Ensure 'Name' and 'ICIMDNosologyNumber' columns are present and populated.");
              } else {
                setRawImds(mappedData);
              }
            }
            setIsLoadingImds(false);
          },
          error: (err: { message: any; }) => {
            setErrorImds(`Critical error parsing IMD info CSV: ${err.message}`);
            setIsLoadingImds(false);
          }
        });
      } catch (e) {
        setErrorImds(e instanceof Error ? e.message : String(e));
        setIsLoadingImds(false);
      }
    }
    fetchImdData();
  }, []);

  useEffect(() => {
    async function fetchRecruitmentData() {
      setIsLoadingRecruitment(true);
      setErrorRecruitment(null);
      try {
        const response = await fetch(CSV_PATH_RECRUITMENT_PLAN);
        if (!response.ok) {
          throw new Error(`Failed to fetch recruitment plan CSV (${CSV_PATH_RECRUITMENT_PLAN}): ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        Papa.parse<RecruitmentPlanEntry>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              const errorMessages = results.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ');
              setErrorRecruitment(`Error parsing recruitment plan CSV: ${errorMessages}`);
            } else {
              const parsedData = results.data;
              setRecruitmentPlanData(parsedData);
              const collaboratorSet = new Set<string>();
              parsedData.forEach(entry => {
                if (entry.Collaborators) {
                  entry.Collaborators.split(',').forEach(collab => {
                    const trimmedCollab = collab.trim();
                    if (trimmedCollab) collaboratorSet.add(trimmedCollab);
                  });
                }
              });
              const sortedCollaborators = Array.from(collaboratorSet).sort((a, b) => a.localeCompare(b));
              setAllCollaborators([SHOW_ALL_COLLABORATORS, ...sortedCollaborators]);
            }
            setIsLoadingRecruitment(false);
          },
          error: (err: { message: any; }) => {
            setErrorRecruitment(`Critical error parsing recruitment plan CSV: ${err.message}`);
            setIsLoadingRecruitment(false);
          }
        });
      } catch (e) {
        setErrorRecruitment(e instanceof Error ? e.message : String(e));
        setIsLoadingRecruitment(false);
      }
    }
    fetchRecruitmentData();
  }, []);

  useEffect(() => {
    async function fetchRecruitedImdsData() {
      setIsLoadingRecruitedImds(true);
      setErrorRecruitedImds(null);
      try {
        const response = await fetch(CSV_PATH_RECRUITED_IMDS);
        if (!response.ok) {
          throw new Error(`Failed to fetch recruited IMDs CSV (${CSV_PATH_RECRUITED_IMDS}): ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        
        Papa.parse<RecruitedImdEntry>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              const errorMessages = results.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ');
              setErrorRecruitedImds(`Error parsing recruited IMDs CSV: ${errorMessages}`);
            } else {
              setRecruitedImdsRawData(results.data);
              const counts: Record<string, number> = {};
              results.data.forEach(entry => {
                const iemCode = entry.IEMNosologyCode;
                if (iemCode) {
                  counts[iemCode] = (counts[iemCode] || 0) + 1;
                }
              });
              setRecruitedCountsByIemCode(counts);
            }
            setIsLoadingRecruitedImds(false);
          },
          error: (err: { message: any; }) => {
            setErrorRecruitedImds(`Critical error parsing recruited IMDs CSV: ${err.message}`);
            setIsLoadingRecruitedImds(false);
          }
        });
      } catch (e) {
        setErrorRecruitedImds(e instanceof Error ? e.message : String(e));
        setIsLoadingRecruitedImds(false);
      }
    }
    fetchRecruitedImdsData();
  }, []);

  const augmentedImds = useMemo(() => {
    if (isLoadingImds || isLoadingRecruitment || isLoadingRecruitedImds) {
      return [];
    }
    return rawImds.map(imd => {
      const planEntry = recruitmentPlanData.find(p => p.GeneSymbol === imd.geneSymbol);
      const recruitedCount = imd.iemNosologyCode ? (recruitedCountsByIemCode[imd.iemNosologyCode] || 0) : 0;
      
      let augmentedImd: IMD = { ...imd, recruitedCount };

      if (planEntry) {
        augmentedImd = {
          ...augmentedImd,
          imdStatus: planEntry.IMDstatus,
          minGroupSize: planEntry.minGroupSize,
          Collaborators: planEntry.Collaborators,
        };
      }
      return augmentedImd;
    });
  }, [rawImds, recruitmentPlanData, recruitedCountsByIemCode, isLoadingImds, isLoadingRecruitment, isLoadingRecruitedImds]);

  const baseFilteredImds = useMemo(() => {
    let imds = augmentedImds.filter(imd => 
      imd.imdStatus?.toLowerCase() === 'flexible' || imd.imdStatus?.toLowerCase() === 'prescribed'
    );
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      imds = imds.filter(imd => 
        imd.name?.toLowerCase().includes(lowerSearchTerm) ||
        imd.geneSymbol?.toLowerCase().includes(lowerSearchTerm) ||
        imd.iemNosologyCode?.toLowerCase().includes(lowerSearchTerm) ||
        imd.alternativeName?.toLowerCase().includes(lowerSearchTerm) ||
        imd.diseaseAbbreviation?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return imds;
  }, [augmentedImds, searchTerm]);

  useEffect(() => {
    if (onStatsUpdate && augmentedImds.length > 0 && !isLoadingRecruitedImds) {
        const allRelevantImds = augmentedImds.filter(imd => 
            imd.imdStatus?.toLowerCase() === 'flexible' || imd.imdStatus?.toLowerCase() === 'prescribed'
        );

        const initialGroupedByCatName: Record<string, IMD[]> = {};
        allRelevantImds.forEach(imd => {
            const categoryName = imd.icimdCategoryName || UNCATEGORIZED_GROUP_NAME;
            if (!initialGroupedByCatName[categoryName]) {
                initialGroupedByCatName[categoryName] = [];
            }
            initialGroupedByCatName[categoryName].push(imd);
        });

        const totalCategoryCount = Object.values(initialGroupedByCatName).filter(group => group.length > 0).length;
        const totalRecruitedPatientCount = recruitedImdsRawData.length;
        
        onStatsUpdate({ 
          categoryCount: totalCategoryCount, 
          imdCount: allRelevantImds.length,
          recruitedPatientCount: totalRecruitedPatientCount 
        });
    }
  }, [onStatsUpdate, augmentedImds, recruitedImdsRawData, isLoadingRecruitedImds]);
  
  const isImdActiveForCollaborator = useCallback((imd: IMD, collaborator: string, filters: { prescribed: boolean, flexible: boolean }) => {
    if (collaborator === SHOW_ALL_COLLABORATORS) {
      return true;
    }
    const isFlexible = imd.imdStatus?.toLowerCase() === 'flexible' && filters.flexible;
    const isPrescribed = imd.imdStatus?.toLowerCase() === 'prescribed' && imd.Collaborators?.toLowerCase().includes(collaborator.toLowerCase()) && filters.prescribed;
    return isFlexible || isPrescribed;
  }, []);

  useEffect(() => {
    const groupedByCatName: Record<string, IMD[]> = {};
    
    baseFilteredImds.forEach(imd => {
      const categoryName = imd.icimdCategoryName || UNCATEGORIZED_GROUP_NAME; 
      if (!groupedByCatName[categoryName]) {
        groupedByCatName[categoryName] = [];
      }
      groupedByCatName[categoryName].push(imd);
    });

    const result: OrderedGroupedIMD[] = [];
    const processedCategories = new Set<string>();

    ICIMD_CATEGORY_NAMES_ORDERED.forEach(catName => {
      if (groupedByCatName[catName] && groupedByCatName[catName].length > 0) {
        const categoryImds = groupedByCatName[catName];
        
        let countForCategory = categoryImds.filter(imd => 
            isImdActiveForCollaborator(imd, selectedCollaborator, statusFilter)
        ).length;
        
        if (selectedCollaborator === SHOW_ALL_COLLABORATORS) {
          countForCategory = categoryImds.length;
        }

        result.push({
          categoryName: catName,
          imds: categoryImds.sort((a, b) => a.name.localeCompare(b.name)),
          count: countForCategory,
        });
        processedCategories.add(catName);
      }
    });

    const otherCategoryNames = Object.keys(groupedByCatName)
      .filter(catName => !processedCategories.has(catName) && groupedByCatName[catName].length > 0)
      .sort((a, b) => a.localeCompare(b));
      
    otherCategoryNames.forEach(catName => {
       const categoryImds = groupedByCatName[catName];
       
       let countForCategory = categoryImds.filter(imd => 
           isImdActiveForCollaborator(imd, selectedCollaborator, statusFilter)
       ).length;

       if (selectedCollaborator === SHOW_ALL_COLLABORATORS) {
         countForCategory = categoryImds.length;
       }
       
       result.push({
        categoryName: catName,
        imds: categoryImds.sort((a, b) => a.name.localeCompare(b.name)),
        count: countForCategory,
      });
    });
    
    setDisplayedOrderedGroupedImds(result);

  }, [baseFilteredImds, selectedCollaborator, statusFilter, isImdActiveForCollaborator]);

  const getDotColor = (imd: IMD): string => {
    const recruited = imd.recruitedCount ?? 0;
    const target = parseInt(imd.minGroupSize ?? '', 10);
    if (isNaN(target) || !imd.minGroupSize) return 'bg-transparent'; 
    if (recruited === 0) return 'bg-red-500';
    if (recruited < target) return 'bg-yellow-400';
    if (recruited >= target) return 'bg-emerald-500';
    return 'bg-transparent';
  };

  if (isLoadingImds || isLoadingRecruitment || isLoadingRecruitedImds) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-8 w-1/2 mb-6" /> 
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg shadow-sm bg-card">
            <Skeleton className="h-7 w-1/3 mb-4" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (errorImds || errorRecruitment || errorRecruitedImds) {
    return (
      <>
        {errorImds && (
          <Alert variant="destructive" className="shadow-md mb-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading IMD Data</AlertTitle>
            <AlertDescription className="mt-1">{errorImds}</AlertDescription>
            <AlertDescription className="mt-1">
              Please ensure `{CSV_PATH_IMD_INFO}` is in the `/public` folder.
            </AlertDescription>
          </Alert>
        )}
        {errorRecruitment && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Recruitment Plan Data</AlertTitle>
            <AlertDescription className="mt-1">{errorRecruitment}</AlertDescription>
            <AlertDescription className="mt-1">
              Please ensure `{CSV_PATH_RECRUITMENT_PLAN}` is in the `/public` folder and contains `GeneSymbol`, `IMDstatus`, `Collaborators`, and `minGroupSize` columns.
            </AlertDescription>
          </Alert>
        )}
        {errorRecruitedImds && (
          <Alert variant="destructive" className="shadow-md mt-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg">Error Loading Recruited Patients Data</AlertTitle>
            <AlertDescription className="mt-1">{errorRecruitedImds}</AlertDescription>
            <AlertDescription className="mt-1">
              Please ensure `{CSV_PATH_RECRUITED_IMDS}` is in the `/public` folder and contains a `IEMNosologyCode` column.
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-8 p-6 border rounded-xl shadow-lg bg-card space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search by name, gene, or IEM code..." 
            className="pl-10 w-full"
          />
        </div>
        <div className="flex md:flex-row flex-col items-center gap-4 pt-2">
          <div className='flex items-center gap-2 w-full md:w-auto'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-none">
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm space-y-3 my-1 z-30" side="top" align='start'>
                <div className="space-y-1.5">
                  <p className="mb-2 font-semibold">Recruitment Status Indicators:</p>
                  <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span><ChevronRight className="h-4 w-4 inline-block mr-2"></ChevronRight>no patients recruited</p>
                  <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 mr-2"></span><ChevronRight className="h-4 w-4 inline-block mr-2"></ChevronRight>recruitment target not reached</p>
                  <p className="mb-2"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span><ChevronRight className="h-4 w-4 inline-block mr-2"></ChevronRight>recruitment target reached</p>
                </div>
                {selectedCollaborator !== SHOW_ALL_COLLABORATORS && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="mb-2 font-semibold">Category Types:</p>
                    <div className='leading-loose'>Only IMDs with <Badge variant="outline" className="mx-1 bg-primary text-primary-foreground border-transparent">Flexible</Badge> (available for all collaborators) and <Badge variant="outline" className="mx-1 bg-primary text-primary-foreground border-transparent">Prescribed</Badge> categories are included in this collaborator's recruitment plan.</div>
                  </div>
                </>
                )}
              </PopoverContent>
            </Popover>
          <Label className="text-sm font-medium whitespace-nowrap">Filter by collaborator:</Label>
          </div>
          <Select
            value={selectedCollaborator}
            onValueChange={setSelectedCollaborator}
          >
            <SelectTrigger id="collaborator-filter" className="w-full md:w-auto min-w-[200px]">
              <SelectValue placeholder="Select Collaborator" />
            </SelectTrigger>
            <SelectContent>
              {allCollaborators.map(collab => (
                <SelectItem key={collab} value={collab}>
                  {collab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCollaborator !== SHOW_ALL_COLLABORATORS && (
            <div className="flex items-center gap-4 w-full md:w-auto px-1 md:px-0">
                <div className="flex items-center space-x-2">
                <Checkbox
                  id="prescribed-filter"
                  checked={statusFilter.prescribed}
                  onCheckedChange={() => toggleStatusFilter('prescribed')}
                />
                <Label htmlFor="prescribed-filter" className="text-sm font-normal cursor-pointer">
                  Prescribed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flexible-filter"
                  checked={statusFilter.flexible}
                  onCheckedChange={() => toggleStatusFilter('flexible')}
                />
                <Label htmlFor="flexible-filter" className="text-sm font-normal cursor-pointer">
                  Flexible
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>

      {displayedOrderedGroupedImds.length === 0 && !isLoadingImds && !isLoadingRecruitment && !isLoadingRecruitedImds && (
         <Alert className="shadow-md">
           <AlertCircle className="h-5 w-5" />
           <AlertTitle className="text-lg">No Data Available</AlertTitle>
           <AlertDescription className="mt-1">
             No IMD matches your current filters.
           </AlertDescription>
         </Alert>
      )}

      <Accordion type="multiple" className="w-full space-y-6">
        {displayedOrderedGroupedImds.map((group) => {
          if (group.imds.length === 0) return null;

          return (
            <AccordionItem 
              value={group.categoryName} 
              key={group.categoryName}
              className="border border-border rounded-lg shadow-md bg-card overflow-hidden"
            >
              <AccordionTrigger 
                className="px-6 py-4 hover:no-underline bg-secondary/20 rounded-t-lg data-[state=closed]:rounded-b-lg data-[state=open]:border-b data-[state=open]:border-border w-full flex justify-between items-center text-left"
              >
                <h3 className="text-xl font-semibold mr-4">
                  {group.categoryName}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({group.count} IMD{group.count !== 1 ? 's' : ''})
                  </span>
                </h3>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="px-4 md:px-6 pt-4 flex flex-wrap gap-2">
                  {group.imds.map((imd) => {
                    const isActive = isImdActiveForCollaborator(imd, selectedCollaborator, statusFilter);
                    
                    let buttonStyleClasses = '';
                    if (selectedCollaborator !== SHOW_ALL_COLLABORATORS) {
                      if (isActive) {
                        buttonStyleClasses = 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary';
                      } else {
                        buttonStyleClasses = 'bg-muted text-muted-foreground opacity-70 hover:opacity-100 border-border';
                      }
                    } else {
                       buttonStyleClasses = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
                    }
                    
                    const statusBadgeText = imd.imdStatus ? imd.imdStatus.charAt(0).toUpperCase() + imd.imdStatus.slice(1) : '';

                    const isFlexible = imd.imdStatus?.toLowerCase() === 'flexible';
                    const isPrescribedForThisCollaborator = imd.imdStatus?.toLowerCase() === 'prescribed' && imd.Collaborators?.toLowerCase().includes(selectedCollaborator.toLowerCase());
                    const shouldShowBadge = selectedCollaborator !== SHOW_ALL_COLLABORATORS && (isFlexible || isPrescribedForThisCollaborator);

                    return (
                      <Popover key={imd.name}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className={cn(
                              "transition-all duration-150 flex items-center gap-2",
                              buttonStyleClasses
                            )}
                          >
                            {imd.minGroupSize && (
                              <span className={cn("inline-block w-2.5 h-2.5 rounded-full", getDotColor(imd))}></span>
                            )}
                            {imd.name}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 sm:w-96 mr-2 z-30" side="bottom" align="start">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-lg leading-tight pr-2">{imd.name}</h4>
                              {shouldShowBadge && (
                                <Badge
                                  variant="outline"
                                  className='bg-primary text-primary-foreground text-xs px-2 py-0.5 whitespace-nowrap border-transparent'
                                >
                                  {statusBadgeText}
                                </Badge>
                              )}
                            </div>

                            {imd.alternativeName && (
                              <p className="flex items-start text-sm text-muted-foreground italic">
                                <FileText className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                                <span>Alternative Name: {imd.alternativeName}</span>
                              </p>
                            )}
                            
                            <Separator />
                            
                             {selectedCollaborator !== SHOW_ALL_COLLABORATORS && (
                               <>
                               <div className="space-y-1.5 text-sm">
                                  <p className="flex items-center">
                                    {isActive ? 
                                      <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> :
                                      <X className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                                    }
                                    {isActive ? `In`:`Not in`} {selectedCollaborator} Recruitment Plan
                                  </p>
                               
                               </div>
                               <Separator />
                               </>
                             )}

                            <div className="space-y-1.5 text-sm">
                              {imd.minGroupSize && (
                                <p className="flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                  <strong>Recruitment Target:</strong>&nbsp;{`${imd.recruitedCount ?? 0}/${imd.minGroupSize}`} Patients
                                </p>
                              )}
                              <p className="flex items-center">
                                <ListChecks className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                <strong>ICIMD No.:</strong>&nbsp;{imd.icimdNosologyNumber}
                              </p>
                              {imd.iemNosologyCode && (
                                <p className="flex items-center">
                                  <Hash className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                  <strong>IEM Code:</strong>&nbsp;{imd.iemNosologyCode}
                                </p>
                              )}
                              {imd.geneSymbol && (
                                <p className="flex items-center">
                                  <Dna className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                  <strong>Gene Symbol:</strong>&nbsp;
                                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{imd.geneSymbol}</span>
                                </p>
                              )}
                            </div>
                            
                            <div className="space-y-2 pt-2">
                              {imd.omimId && (
                                <Button variant="outline" size="sm" asChild className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors group">
                                  <Link
                                    href={`https://omim.org/entry/${imd.omimId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`View OMIM entry for ${imd.omimId}`}
                                  >
                                    View on OMIM
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                              {imd.iemBaseId && (
                                <Button variant="outline" size="sm" asChild className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors group">
                                  <Link
                                    href={`https://www.iembase.com/disorder/${imd.iemBaseId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`View ${imd.name} on IEMbase`}
                                  >
                                    View on IEMbase
                                    <ExternalLink className="ml-2 h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </>
  );
}
