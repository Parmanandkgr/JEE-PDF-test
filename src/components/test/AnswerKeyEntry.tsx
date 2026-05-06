"use client"

import { useState } from 'react';
import { SubjectConfig, AnswerKeyMap, QuestionType } from '@/app/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck } from 'lucide-react';

interface AnswerKeyEntryProps {
  subjects: SubjectConfig[];
  onComplete: (key: AnswerKeyMap) => void;
}

export function AnswerKeyEntry({ subjects, onComplete }: AnswerKeyEntryProps) {
  const [answerKey, setAnswerKey] = useState<AnswerKeyMap>({});

  const questions: { id: string; num: number; type: QuestionType; subject: string; section: string }[] = [];
  let globalIndex = 1;
  subjects.forEach(sub => {
    sub.sections.forEach(sec => {
      for (let i = 1; i <= sec.numQuestions; i++) {
        questions.push({
          id: `${sec.id}-${i}`,
          num: globalIndex++,
          type: sec.type,
          subject: sub.name,
          section: sec.name
        });
      }
    });
  });

  const handleUpdate = (id: string, val: string | string[]) => {
    setAnswerKey(prev => ({ ...prev, [id]: val }));
  };

  const handleMultiple = (id: string, option: string) => {
    const current = (answerKey[id] as string[]) || [];
    if (current.includes(option)) {
      handleUpdate(id, current.filter(o => o !== option));
    } else {
      handleUpdate(id, [...current, option].sort());
    }
  };

  return (
    <div className="container max-w-4xl py-10 space-y-8 h-screen flex flex-col">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Post-Test Validation</h1>
        <p className="text-muted-foreground">Input the official answer key to calculate your score.</p>
      </div>

      <ScrollArea className="flex-1 bg-card/30 border border-muted rounded-xl p-6">
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-muted pb-4 last:border-0">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-secondary">{q.subject} • {q.section}</span>
                <span className="text-lg font-bold">Q{q.num} <span className="text-xs font-normal text-muted-foreground">({q.type})</span></span>
              </div>

              <div className="md:col-span-3">
                {q.type === 'single' && (
                  <div className="flex gap-4">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <Button
                        key={opt}
                        variant={answerKey[q.id] === opt ? "default" : "outline"}
                        size="sm"
                        className="w-12 h-10"
                        onClick={() => handleUpdate(q.id, opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}

                {q.type === 'multiple' && (
                  <div className="flex gap-4">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <Button
                        key={opt}
                        variant={(answerKey[q.id] as string[])?.includes(opt) ? "default" : "outline"}
                        size="sm"
                        className="w-12 h-10"
                        onClick={() => handleMultiple(q.id, opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                )}

                {q.type === 'numeric' && (
                  <Input 
                    placeholder="Official Value" 
                    className="max-w-[200px]"
                    value={answerKey[q.id] || ''}
                    onChange={(e) => handleUpdate(q.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Button className="w-full bg-primary text-primary-foreground h-14 text-xl font-bold" onClick={() => onComplete(answerKey)}>
        <CheckCheck className="mr-2" /> Calculate Final Analysis
      </Button>
    </div>
  );
}
