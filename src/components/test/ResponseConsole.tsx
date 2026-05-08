
"use client"

import { useState, useEffect, useMemo, ReactNode, useRef } from 'react';
import { SubjectConfig, SectionConfig, ResponseMap } from '@/app/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { User } from 'lucide-react';

interface ResponseConsoleProps {
  subjects: SubjectConfig[];
  activeSubjectIdx: number;
  activeSectionIdx: number;
  activeQuestionNum: number;
  setActiveQuestionNum: (num: number | ((prev: number) => number)) => void;
  responses: ResponseMap;
  elapsedTime: number;
  onResponse: (id: string, value: string | string[], timeSpent: number, markedAt: number, isMarkedForReview: boolean) => void;
  onSubmit: () => void;
  onQuestionChange: (sIdx: number, secIdx: number) => void;
  timerElement: ReactNode;
}

export function ResponseConsole({ 
  subjects, 
  activeSubjectIdx, 
  activeSectionIdx, 
  activeQuestionNum,
  setActiveQuestionNum,
  responses, 
  elapsedTime, 
  onResponse, 
  onSubmit, 
  onQuestionChange,
  timerElement
}: ResponseConsoleProps) {
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [initialTimeSpent, setInitialTimeSpent] = useState<number>(0);

  const activeSubject = subjects[activeSubjectIdx];
  const activeSection = activeSubject.sections[activeSectionIdx];
  const activeQuestionId = `${activeSection.id}-${activeQuestionNum}`;

  const globalQNum = useMemo(() => {
    let count = 0;
    for (let s = 0; s <= activeSubjectIdx; s++) {
      const sub = subjects[s];
      for (let secIdx = 0; secIdx < sub.sections.length; secIdx++) {
        const sec = sub.sections[secIdx];
        if (s === activeSubjectIdx && secIdx === activeSectionIdx) {
          return count + activeQuestionNum;
        }
        count += sec.numQuestions;
      }
    }
    return count;
  }, [subjects, activeSubjectIdx, activeSectionIdx, activeQuestionNum]);

  const refs = useRef({
    responses,
    onResponse,
    elapsedTime,
    activeQuestionId,
    activeSection
  });

  useEffect(() => {
    refs.current = { responses, onResponse, elapsedTime, activeQuestionId, activeSection };
  }, [responses, onResponse, elapsedTime, activeQuestionId, activeSection]);

  useEffect(() => {
    const startTime = Date.now();
    const qIdAtStart = activeQuestionId;
    const initialAtStart = responses[activeQuestionId]?.timeSpent || 0;
    
    setQuestionStartTime(startTime);
    setInitialTimeSpent(initialAtStart);

    return () => {
      const now = Date.now();
      const sessionDuration = Math.floor((now - startTime) / 1000);
      if (sessionDuration > 0) {
        const currentRes = refs.current.responses[qIdAtStart];
        const val = currentRes?.value || (refs.current.activeSection.type === 'multiple' ? [] : '');
        const isMarked = currentRes?.isMarkedForReview || false;
        
        refs.current.onResponse(
          qIdAtStart, 
          val, 
          initialAtStart + sessionDuration, 
          refs.current.elapsedTime, 
          isMarked
        );
      }
    };
  }, [activeQuestionId]);

  const getCurrentTimeSpent = () => {
    const now = Date.now();
    const elapsedLocal = Math.floor((now - questionStartTime) / 1000);
    return initialTimeSpent + elapsedLocal;
  };

  const handleOptionClick = (val: string) => {
    const current = responses[activeQuestionId]?.value;
    const isMarked = responses[activeQuestionId]?.isMarkedForReview || false;
    if (activeSection.type === 'multiple') {
      const arr = Array.isArray(current) ? [...current] : [];
      const newValue = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val].sort();
      onResponse(activeQuestionId, newValue, getCurrentTimeSpent(), elapsedTime, isMarked);
    } else {
      onResponse(activeQuestionId, val, getCurrentTimeSpent(), elapsedTime, isMarked);
    }
  };

  const saveAndNext = () => {
    onResponse(activeQuestionId, responses[activeQuestionId]?.value || (activeSection.type === 'multiple' ? [] : ''), getCurrentTimeSpent(), elapsedTime, false);
    goToNext();
  };

  const markAndNext = () => {
    onResponse(activeQuestionId, responses[activeQuestionId]?.value || (activeSection.type === 'multiple' ? [] : ''), getCurrentTimeSpent(), elapsedTime, true);
    goToNext();
  };

  const clearResponse = () => {
    onResponse(activeQuestionId, activeSection.type === 'multiple' ? [] : '', getCurrentTimeSpent(), elapsedTime, false);
  };

  const goToNext = () => {
    if (activeQuestionNum < activeSection.numQuestions) {
      setActiveQuestionNum(prev => prev + 1);
    } else {
      let nextSecIdx = activeSectionIdx + 1;
      let nextSubIdx = activeSubjectIdx;
      if (nextSecIdx >= subjects[activeSubjectIdx].sections.length) {
        nextSecIdx = 0;
        nextSubIdx = (activeSubjectIdx + 1);
        if (nextSubIdx >= subjects.length) return;
      }
      onQuestionChange(nextSubIdx, nextSecIdx);
      setActiveQuestionNum(1);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="p-3 border-b border-slate-300 flex items-center justify-between bg-white shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#333]">Candidate Panel</span>
            </div>
         </div>
         <div className="flex flex-col items-end">
           <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Time Left</span>
           <div className="flex items-center gap-1">
             {timerElement}
           </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#fcfcfc] overflow-hidden">
        <div className="p-6 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[18px] font-black text-[#333]">Question No: {globalQNum}</p>
            <span className="text-[12px] font-bold text-[#0076ad] uppercase bg-blue-50 px-3 py-1 rounded">{activeSubject.name} | {activeSection.name}</span>
          </div>
          
          <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm min-h-[300px]">
            {activeSection.type === 'single' && (
              <RadioGroup 
                className="space-y-6" 
                value={responses[activeQuestionId]?.value as string || ''}
                onValueChange={handleOptionClick}
              >
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} className="flex items-center space-x-4 group cursor-pointer">
                    <RadioGroupItem value={opt} id={`q-${activeQuestionId}-${opt}`} className="w-6 h-6 border-slate-300" />
                    <Label htmlFor={`q-${activeQuestionId}-${opt}`} className="text-[16px] font-medium text-slate-700 cursor-pointer">Option {opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {activeSection.type === 'multiple' && (
              <div className="space-y-6">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const current = (responses[activeQuestionId]?.value as string[]) || [];
                  return (
                    <div key={opt} className="flex items-center space-x-4 group cursor-pointer">
                      <Checkbox 
                        id={`q-${activeQuestionId}-${opt}`} 
                        checked={current.includes(opt)}
                        onCheckedChange={() => handleOptionClick(opt)}
                        className="w-6 h-6 rounded-none border-slate-300"
                      />
                      <Label htmlFor={`q-${activeQuestionId}-${opt}`} className="text-[16px] font-medium text-slate-700 cursor-pointer">Option {opt}</Label>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection.type === 'numeric' && (
              <div className="space-y-6">
                <Label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enter Numeric Answer</Label>
                <Input 
                  type="text" 
                  placeholder="0.00" 
                  className="text-3xl font-mono h-20 border-slate-300 focus:ring-blue-500 bg-slate-50 text-center"
                  value={responses[activeQuestionId]?.value || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.-]/g, '');
                    const isMarked = responses[activeQuestionId]?.isMarkedForReview || false;
                    onResponse(activeQuestionId, val, getCurrentTimeSpent(), elapsedTime, isMarked);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-300 p-4 space-y-3 shrink-0">
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-white border border-slate-300 text-[#333] font-bold text-[12px] h-12 hover:bg-slate-100 transition-colors uppercase shadow-sm"
              onClick={markAndNext}
            >
              MARK FOR REVIEW & NEXT
            </button>
            <button 
              className="px-8 bg-white border border-slate-300 text-[#333] font-bold text-[12px] h-12 hover:bg-slate-100 transition-colors uppercase shadow-sm"
              onClick={clearResponse}
            >
              CLEAR RESPONSE
            </button>
          </div>
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-[#2d76b1] text-white font-bold text-[12px] h-12 hover:bg-[#256396] transition-colors uppercase shadow-sm"
              onClick={saveAndNext}
            >
              SAVE & NEXT
            </button>
            <button 
              className="px-12 bg-[#1a4a6e] text-white font-bold text-[12px] h-12 hover:bg-[#123652] transition-colors uppercase shadow-sm"
              onClick={onSubmit}
            >
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
