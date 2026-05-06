
"use client"

import { useState, useEffect } from 'react';
import { TestConfig } from '@/components/test/TestConfig';
import { ResponseConsole } from '@/components/test/ResponseConsole';
import { QuestionPalette } from '@/components/test/QuestionPalette';
import { TestTimer } from '@/components/test/TestTimer';
import { AnswerKeyEntry } from '@/components/test/AnswerKeyEntry';
import { AnalyticsDashboard, calculateJEEAdvScore } from '@/components/test/AnalyticsDashboard';
import { TestHistory } from '@/components/test/TestHistory';
import { TestConfiguration, ResponseMap, AnswerKeyMap, TestStatus, SavedTest } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { Info, FileText, Heart } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<TestStatus>('setup');
  const [config, setConfig] = useState<TestConfiguration | null>(null);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [answerKey, setAnswerKey] = useState<AnswerKeyMap>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionNum, setActiveQuestionNum] = useState(1);

  const startTest = (conf: TestConfiguration) => {
    setConfig(conf);
    setResponses({});
    setElapsedTime(0);
    setStatus('testing');
    setActiveSubjectIdx(0);
    setActiveSectionIdx(0);
    setActiveQuestionNum(1);
  };

  const handleResponse = (id: string, value: string | string[], timeSpent: number, markedAt: number, isMarkedForReview: boolean) => {
    setResponses(prev => ({
      ...prev,
      [id]: { value, timeSpent, markedAt, isMarkedForReview }
    }));
  };

  const submitTest = () => {
    if (confirm("Are you sure you want to submit the test?")) {
      setStatus('answering');
    }
  };

  const completeAnswerKey = (key: AnswerKeyMap) => {
    setAnswerKey(key);
    
    if (config) {
      let totalScore = 0;
      config.subjects.forEach(sub => {
        sub.sections.forEach(sec => {
          for (let i = 1; i <= sec.numQuestions; i++) {
            const qId = `${sec.id}-${i}`;
            totalScore += calculateJEEAdvScore(responses[qId]?.value, key[qId], sec);
          }
        });
      });

      const newSavedTest: SavedTest = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        config,
        responses,
        answerKey: key,
        totalScore
      };

      const existingHistory = JSON.parse(localStorage.getItem('brutal_score_history') || '[]');
      localStorage.setItem('brutal_score_history', JSON.stringify([...existingHistory, newSavedTest]));
    }
    
    setStatus('results');
  };

  const viewSavedTest = (test: SavedTest) => {
    setConfig(test.config);
    setResponses(test.responses);
    setAnswerKey(test.answerKey);
    setStatus('results');
  };

  const resetAll = () => {
    setStatus('setup');
    setConfig(null);
    setResponses({});
    setAnswerKey({});
    setElapsedTime(0);
  };

  const CreditBanner = () => (
    <div className="bg-slate-900 text-slate-400 text-[10px] py-1.5 text-center font-bold tracking-widest uppercase shrink-0">
      Made with <Heart className="inline-block w-2.5 h-2.5 mx-1 text-red-500 fill-red-500" /> by Parmanand Singhal
    </div>
  );

  if (status === 'setup') return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <TestConfig onStart={startTest} onViewHistory={() => setStatus('history')} />
      </div>
      <CreditBanner />
    </div>
  );

  if (status === 'history') return <TestHistory onBack={() => setStatus('setup')} onViewTest={viewSavedTest} />;
  
  if (status === 'testing' && config) {
    const activeSubject = config.subjects[activeSubjectIdx];
    const activeSection = activeSubject.sections[activeSectionIdx];

    return (
      <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden font-sans">
        <header className="h-[60px] bg-white border-b border-slate-300 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-[#414141] text-white px-2 py-0.5 rounded font-bold text-[14px]">JEE</div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#333]">JEE (Advanced) Paper Mock Exam</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#2d76b1] hover:underline">
               <Info className="w-4 h-4" /> Instructions
             </button>
             <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#2d76b1] hover:underline">
               <FileText className="w-4 h-4" /> Question Paper
             </button>
          </div>
        </header>

        <div className="h-[45px] bg-[#e5e5e5] border-b border-slate-300 flex items-center px-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5">
            {config.subjects.flatMap((sub, sIdx) => 
              sub.sections.map((sec, secIdx) => (
                <button
                  key={`${sub.id}-${sec.id}`}
                  onClick={() => {
                    setActiveSubjectIdx(sIdx);
                    setActiveSectionIdx(secIdx);
                    setActiveQuestionNum(1);
                  }}
                  className={cn(
                    "px-4 h-[35px] flex items-center justify-center text-[11px] font-bold rounded-t-sm transition-all whitespace-nowrap border-x border-t",
                    activeSubjectIdx === sIdx && activeSectionIdx === secIdx 
                      ? "bg-[#0076ad] text-white border-[#0076ad]" 
                      : "bg-[#f2f2f2] text-[#333] border-slate-300 hover:bg-slate-200"
                  )}
                >
                  {sub.name} {sec.name}
                  <Info className="w-3 h-3 ml-2 opacity-50" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: PDF VIEWER */}
          <div className="basis-[50%] flex flex-col overflow-hidden bg-white border-r border-slate-300">
            <div className="h-[35px] border-b border-slate-200 flex items-center justify-between px-4 shrink-0 bg-[#f5f5f5]">
              <span className="text-[12px] font-bold text-[#333]">Question Paper Viewer</span>
              <div className="flex items-center gap-6">
                 <span className="text-[11px] text-[#333]">Marks: <span className="text-green-600 font-bold">+{activeSection.positiveMarks}</span> / <span className="text-red-600 font-bold">-{activeSection.negativeMarks}</span></span>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100">
               {config.pdfUrl ? (
                <iframe 
                  src={config.pdfUrl} 
                  className="w-full h-full border-none" 
                  title="Question Paper"
                />
              ) : (
                <div className="w-full h-full p-10 text-slate-400 text-center flex flex-col items-center justify-center">
                  <p className="text-lg font-bold">PDF NOT UPLOADED</p>
                  <p className="text-sm">Please upload a paper in setup to view questions here.</p>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: RESPONSE CONSOLE */}
          <div className="basis-[35%] shrink-0 h-full flex flex-col bg-white border-r border-slate-300">
             <ResponseConsole 
                subjects={config.subjects}
                activeSubjectIdx={activeSubjectIdx}
                activeSectionIdx={activeSectionIdx}
                activeQuestionNum={activeQuestionNum}
                setActiveQuestionNum={setActiveQuestionNum}
                responses={responses}
                elapsedTime={elapsedTime}
                onResponse={handleResponse}
                onSubmit={submitTest}
                onQuestionChange={(sIdx, secIdx) => {
                  setActiveSubjectIdx(sIdx);
                  setActiveSectionIdx(secIdx);
                }}
                timerElement={
                  <TestTimer 
                    durationMinutes={config.totalTimeMinutes} 
                    onTimeUpdate={setElapsedTime}
                    onTimeUp={submitTest}
                  />
                }
             />
          </div>

          {/* RIGHT: QUESTION PALETTE */}
          <div className="basis-[15%] bg-slate-50 overflow-hidden flex flex-col">
            <QuestionPalette 
              subjects={config.subjects}
              activeSubjectIdx={activeSubjectIdx}
              activeSectionIdx={activeSectionIdx}
              activeQuestionNum={activeQuestionNum}
              responses={responses}
              onQuestionChange={(sIdx, secIdx, qNum) => {
                setActiveSubjectIdx(sIdx);
                setActiveSectionIdx(secIdx);
                setActiveQuestionNum(qNum);
              }}
            />
          </div>
        </div>
        <CreditBanner />
      </div>
    );
  }

  if (status === 'answering' && config) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <AnswerKeyEntry subjects={config.subjects} onComplete={completeAnswerKey} />
        </div>
        <CreditBanner />
      </div>
    );
  }

  if (status === 'results' && config) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <AnalyticsDashboard 
            subjects={config.subjects}
            responses={responses}
            answerKey={answerKey}
            totalTimeMinutes={config.totalTimeMinutes}
            onReset={resetAll}
          />
        </div>
        <CreditBanner />
      </div>
    );
  }

  return null;
}
