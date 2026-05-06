
"use client"

import { SubjectConfig, ResponseMap } from '@/app/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface QuestionPaletteProps {
  subjects: SubjectConfig[];
  activeSubjectIdx: number;
  activeSectionIdx: number;
  activeQuestionNum: number;
  responses: ResponseMap;
  onQuestionChange: (sIdx: number, secIdx: number, qNum: number) => void;
}

export function QuestionPalette({ 
  subjects, 
  activeSubjectIdx, 
  activeSectionIdx, 
  activeQuestionNum,
  responses, 
  onQuestionChange 
}: QuestionPaletteProps) {
  
  const getQuestionStatus = (qId: string) => {
    const res = responses[qId];
    if (!res) return 'not-visited';
    const hasValue = Array.isArray(res.value) ? res.value.length > 0 : res.value !== '';
    if (res.isMarkedForReview) {
      return hasValue ? 'marked-answered' : 'marked';
    }
    return hasValue ? 'answered' : 'not-answered';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-3 border-b border-slate-200 bg-white">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Question Palette</p>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-6">
          {subjects.map((sub, sIdx) => (
            <div key={sub.id} className="space-y-2">
              <p className="text-[10px] font-black text-blue-600 uppercase border-b border-blue-100 pb-1">{sub.name}</p>
              {sub.sections.map((sec, secIdx) => (
                <div key={sec.id} className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400">{sec.name}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: sec.numQuestions }, (_, i) => {
                      const qNum = i + 1;
                      const qId = `${sec.id}-${qNum}`;
                      const status = getQuestionStatus(qId);
                      const isActive = activeSubjectIdx === sIdx && activeSectionIdx === secIdx && activeQuestionNum === qNum;

                      return (
                        <button
                          key={qId}
                          onClick={() => onQuestionChange(sIdx, secIdx, qNum)}
                          className={cn(
                            "aspect-square text-[10px] font-bold flex items-center justify-center transition-all",
                            isActive ? "ring-2 ring-blue-500 ring-offset-1 z-10" : "",
                            status === 'not-visited' && "bg-white text-slate-600 border border-slate-200",
                            status === 'not-answered' && "bg-[#ee3224] text-white jee-shape-not-answered",
                            status === 'answered' && "bg-[#2ca02c] text-white jee-shape-answered",
                            status === 'marked' && "bg-[#8a2be2] text-white rounded-full",
                            status === 'marked-answered' && "bg-[#8a2be2] text-white rounded-full border-2 border-green-500"
                          )}
                        >
                          {qNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 bg-white border-t border-slate-200 space-y-1.5">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-bold text-slate-500">
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#2ca02c] jee-shape-answered"></div> Answered</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ee3224] jee-shape-not-answered"></div> Not Ans</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-white border border-slate-200"></div> Not Visited</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#8a2be2] rounded-full"></div> Marked</div>
        </div>
      </div>
    </div>
  );
}
