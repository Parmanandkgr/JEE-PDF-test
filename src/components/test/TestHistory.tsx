
"use client"

import { useState, useMemo, useRef } from 'react';
import { SavedTest, SectionConfig, QuestionType } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  History, 
  Trash2, 
  ChevronRight, 
  Calendar, 
  Award, 
  ArrowLeft, 
  TrendingUp,
  BrainCircuit,
  Flame,
  Scale,
  Zap as ZapIcon,
  AreaChart as AreaChartIcon,
  BarChart as BarChartIcon,
  Download,
  Upload,
  Activity,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { calculateJEEAdvScore } from './AnalyticsDashboard';

interface TestHistoryProps {
  onBack: () => void;
  onViewTest: (test: SavedTest) => void;
}

export function TestHistory({ onBack, onViewTest }: TestHistoryProps) {
  const [refresh, setRefresh] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savedTests: SavedTest[] = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('brutal_score_history') || '[]');
  }, [refresh]);

  const deleteTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this test record?")) {
      const updated = savedTests.filter(t => t.id !== id);
      localStorage.setItem('brutal_score_history', JSON.stringify(updated));
      setRefresh(prev => prev + 1);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(savedTests, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `brutal_score_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const existing = JSON.parse(localStorage.getItem('brutal_score_history') || '[]');
          const combined = [...existing];
          imported.forEach(test => {
            if (!combined.find(t => t.id === test.id)) combined.push(test);
          });
          localStorage.setItem('brutal_score_history', JSON.stringify(combined));
          setRefresh(prev => prev + 1);
          alert("Backup restored successfully!");
        }
      } catch (err) {
        console.error("Backup restoration error:", err);
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const aggregateMetrics = useMemo(() => {
    if (savedTests.length === 0) return null;

    let totalScore = 0;
    let totalMax = 0;
    let totalCorrect = 0;
    let totalAttempted = 0;
    let totalQuestions = 0;
    let totalTimeSpent = 0;
    let totalNegativeLoss = 0;
    let totalUnattemptedTime = 0; 
    let timeOnCorrect = 0;
    let timeOnIncorrect = 0;
    let overthinkingCount = 0;
    let sillyErrorCount = 0;
    let firstHalfCorrect = 0;
    let firstHalfAttempts = 0;
    let secondHalfCorrect = 0;
    let secondHalfAttempts = 0;
    let guessCorrect = 0;
    let guessIncorrect = 0;
    let last30mCorrect = 0;
    let last30mAttempts = 0;

    const subjectData: Record<string, { score: number, max: number, correct: number, attempts: number, time: number }> = {};
    const intervalData = Array.from({ length: 6 }, (_, i) => ({
      time: `${(i + 1) * 30}m`,
      correct: 0,
      attempts: 0,
      cumulativeScore: 0
    }));

    const sectionMetrics: Record<QuestionType, { score: number, max: number, correct: number, attempts: number }> = {
      single: { score: 0, max: 0, correct: 0, attempts: 0 },
      multiple: { score: 0, max: 0, correct: 0, attempts: 0 },
      numeric: { score: 0, max: 0, correct: 0, attempts: 0 }
    };

    savedTests.forEach(test => {
      test.config.subjects.forEach(sub => {
        if (!subjectData[sub.name]) subjectData[sub.name] = { score: 0, max: 0, correct: 0, attempts: 0, time: 0 };
        
        sub.sections.forEach(sec => {
          subjectData[sub.name].max += sec.numQuestions * sec.positiveMarks;
          sectionMetrics[sec.type].max += sec.numQuestions * sec.positiveMarks;

          for (let i = 1; i <= sec.numQuestions; i++) {
            const qId = `${sec.id}-${i}`;
            const res = test.responses[qId];
            const key = test.answerKey[qId];
            const time = res?.timeSpent || 0;
            const markedAt = res?.markedAt || 0;
            
            totalQuestions++;
            subjectData[sub.name].time += time;

            const hasResponse = res && res.value && (Array.isArray(res.value) ? res.value.length > 0 : res.value !== '');
            const score = hasResponse ? calculateJEEAdvScore(res.value, key, sec) : 0;

            if (hasResponse) {
              totalAttempted++;
              subjectData[sub.name].attempts++;
              sectionMetrics[sec.type].attempts++;
              sectionMetrics[sec.type].score += score;
              totalScore += score;
              subjectData[sub.name].score += score;

              const intervalIdx = Math.min(5, Math.floor(markedAt / (30 * 60)));
              intervalData[intervalIdx].attempts++;

              if (markedAt < (test.config.totalTimeMinutes * 30)) {
                firstHalfAttempts++;
                if (score > 0) firstHalfCorrect++;
              } else {
                secondHalfAttempts++;
                if (score > 0) secondHalfCorrect++;
              }

              if (markedAt > (test.config.totalTimeMinutes * 60 - 1800)) {
                last30mAttempts++;
                if (score > 0) last30mCorrect++;
              }

              if (score > 0) {
                totalCorrect++;
                subjectData[sub.name].correct++;
                sectionMetrics[sec.type].correct++;
                timeOnCorrect += time;
                intervalData[intervalIdx].correct++;
                for (let j = intervalIdx; j < 6; j++) intervalData[j].cumulativeScore += score;
                if (time < 45) guessCorrect++;
              } else if (score < 0) {
                timeOnIncorrect += time;
                totalNegativeLoss += Math.abs(score);
                for (let j = intervalIdx; j < 6; j++) intervalData[j].cumulativeScore += score;
                if (time < 45) {
                  guessIncorrect++;
                  sillyErrorCount++;
                }
                if (time > 180) overthinkingCount++;
              }
            } else {
              if (res) {
                totalUnattemptedTime += time;
                if (time > 180) overthinkingCount++;
              }
            }
          }
        });
      });
      totalTimeSpent += (test.config.totalTimeMinutes * 60); 
    });

    const n = savedTests.length;
    const avgScorePercentage = (totalScore / totalMax) * 100;

    const getProjectedAIR = (pct: number) => {
      if (pct > 43) return "< 5000";
      if (pct >= 39.5) return "5000 - 8000";
      if (pct >= 37.5) return "8000 - 10000";
      if (pct >= 36) return "10000 - 15000";
      if (pct >= 32) return "15000 - 20000";
      if (pct >= 23) return "> 25000";
      return "> 50000";
    };

    const firstHalfAccuracy = firstHalfAttempts > 0 ? (firstHalfCorrect / firstHalfAttempts) * 100 : 0;
    const secondHalfAccuracy = secondHalfAttempts > 0 ? (secondHalfCorrect / secondHalfAttempts) * 100 : 0;

    return {
      n,
      points: {
        subjectScores: Object.entries(subjectData).map(([name, data]) => ({
          name,
          score: Math.round(data.score / n),
          max: Math.round(data.max / n),
          accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
          time: Math.round(data.time / (n * 60)),
          roi: data.time > 0 ? (data.score / (data.time / 60)) : 0
        })),
        sectionalScores: Object.entries(sectionMetrics).map(([type, data]) => ({
          name: type.toUpperCase(),
          accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
          yield: data.max > 0 ? (data.score / data.max) * 100 : 0
        })),
        projectedAIR: getProjectedAIR(avgScorePercentage),
        accuracyRate: totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0,
        avgTimeCorrect: totalCorrect > 0 ? Math.round(timeOnCorrect / totalCorrect) : 0,
        avgTimeIncorrect: (totalAttempted - totalCorrect) > 0 ? Math.round(timeOnIncorrect / (totalAttempted - totalCorrect)) : 0,
        avgUnattemptedDrain: Math.round(totalUnattemptedTime / (n * 60)),
        intervalData: intervalData.map(d => ({ 
          ...d, 
          correct: d.correct / n, 
          attempts: d.attempts / n,
          cumulativeScore: d.cumulativeScore / n
        })),
        selectionRatio: totalQuestions > 0 ? (totalAttempted / totalQuestions) * 100 : 0,
        negativeImpact: Math.round(totalNegativeLoss / n),
        guessing: { hits: Math.round(guessCorrect / n), misses: Math.round(guessIncorrect / n) },
        panicAccuracy: last30mAttempts > 0 ? (last30mCorrect / last30mAttempts) * 100 : 0,
        staminaIndex: firstHalfAccuracy > 0 ? (secondHalfAccuracy / firstHalfAccuracy) * 100 : 0,
        overthinking: Math.round(overthinkingCount / n),
        sillyErrors: Math.round(sillyErrorCount / n),
        efficiency: (totalScore / (totalTimeSpent / 60)).toFixed(2),
        wasteRatio: totalTimeSpent > 0 ? (timeOnIncorrect / totalTimeSpent) * 100 : 0
      }
    };
  }, [savedTests]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-12 flex-1 w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
              <History className="w-10 h-10 text-blue-600" /> Audit Vault
            </h1>
            <p className="text-slate-500 font-medium">Aggregate Intelligence (All 23-Points Averaged)</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <input type="file" ref={fileInputRef} onChange={importHistory} className="hidden" accept=".json" />
             <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl h-12 border-slate-300 font-bold text-blue-600">
               <Upload className="w-4 h-4 mr-2" /> Restore Backup
             </Button>
             <Button variant="outline" onClick={exportHistory} className="rounded-xl h-12 border-slate-300 font-bold text-green-600">
               <Download className="w-4 h-4 mr-2" /> Download Backup
             </Button>
             <Button variant="outline" onClick={onBack} className="rounded-xl h-12 border-slate-300 font-bold">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back to Setup
             </Button>
          </div>
        </div>

        {aggregateMetrics && (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-black text-slate-800">Aggregate 23-Point Performance</h2>
            </div>

            {/* THE BIG PICTURE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">1. Avg Subject Scores</p>
                  <div className="space-y-3">
                    {aggregateMetrics.points.subjectScores.map(s => (
                      <div key={s.name} className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">{s.name}</span>
                        <span className="text-sm font-black text-slate-900">{s.score}/{s.max}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none bg-blue-50/30">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">2. Aggregate Projected AIR</p>
                  <div className="flex flex-col items-center justify-center h-16">
                    <p className="text-2xl font-black text-blue-700">{aggregateMetrics.points.projectedAIR}</p>
                    <p className="text-[9px] font-bold text-blue-400">Cumulative Benchmark</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">3. Subject Accuracy (Avg)</p>
                  <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregateMetrics.points.subjectScores}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Bar dataKey="accuracy" radius={[2, 2, 0, 0]}>
                          {aggregateMetrics.points.subjectScores.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">4. Avg Accuracy Rate</p>
                  <div className="flex flex-col items-center justify-center h-16">
                    <p className="text-2xl font-black text-green-600">{aggregateMetrics.points.accuracyRate.toFixed(1)}%</p>
                    <p className="text-[9px] font-bold text-slate-400">Cumulative Precision</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* STRATEGY & BEHAVIORAL ANALYSIS */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">10. Avg Selection Ratio</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-slate-900">{aggregateMetrics.points.selectionRatio.toFixed(0)}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none border-l-red-500 border-l-4">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">11. Avg Negative Impact</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-red-600">-{aggregateMetrics.points.negativeImpact}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">12. Avg Guessing</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div><p className="text-lg font-black text-green-600">{aggregateMetrics.points.guessing.hits}</p></div>
                      <div><p className="text-lg font-black text-red-600">{aggregateMetrics.points.guessing.misses}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">13. Avg Pacing</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black">{Math.round(aggregateMetrics.points.panicAccuracy)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-none border-l-orange-500 border-l-4">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">14. Avg Stamina</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-orange-600">{aggregateMetrics.points.staminaIndex.toFixed(0)}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none border-l-purple-500 border-l-4">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">15. Avg Overthinking</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-purple-600">{aggregateMetrics.points.overthinking}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none border-l-red-500 border-l-4">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">16. Avg Silly Errors</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-red-600">{aggregateMetrics.points.sillyErrors}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none border-l-blue-500 border-l-4">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">17. Avg Efficiency</p>
                    <div className="flex flex-col items-center justify-center h-16">
                      <p className="text-2xl font-black text-blue-600">{aggregateMetrics.points.efficiency}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* YIELD & EFFICIENCY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardHeader>
                   <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" /> 19. Avg Subject ROI (Marks/Min)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregateMetrics.points.subjectScores} layout="vertical">
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="name" type="category" fontSize={10} width={70} />
                        <Tooltip />
                        <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                          {aggregateMetrics.points.subjectScores.map((_, i) => <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b'][i % 3]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-600" /> 20. Avg Sectional Precision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregateMetrics.points.sectionalScores}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis domain={[0, 100]} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="accuracy" name="Accuracy %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="yield" name="Score %" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">21. Avg Cumulative Score Trend</p>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aggregateMetrics.points.intervalData}>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="stepAfter" dataKey="cumulativeScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">22. Avg Effort Balance</p>
                  <div className="space-y-3 mt-2">
                    {aggregateMetrics.points.subjectScores.map((s, i) => (
                      <div key={s.name} className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{s.time}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none border-l-red-500 border-l-4">
                <CardContent className="pt-6">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">23. Avg Waste Ratio</p>
                  <div className="flex flex-col items-center justify-center h-20 text-center">
                    <p className="text-3xl font-black text-red-600">{aggregateMetrics.points.wasteRatio.toFixed(1)}%</p>
                    <p className="text-[9px] font-bold text-red-400 mt-1">Avg time on Incorrect answers</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="space-y-6 pt-10">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-black text-slate-800">Session History Log</h2>
          </div>
          
          {savedTests.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No saved audits found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((test) => (
                <Card 
                  key={test.id} 
                  className="cursor-pointer hover:border-blue-400 transition-all group overflow-hidden border-slate-200 shadow-sm"
                  onClick={() => onViewTest(test)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <div className="bg-slate-900 text-white p-6 flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-2xl font-black">{test.totalScore}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">Score</span>
                      </div>
                      <div className="flex-1 p-6 flex justify-between items-center bg-white">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800">JEE Mock Session</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(test.date), 'PPP p')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-600" onClick={(e) => deleteTest(test.id, e)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 text-slate-400 text-[10px] py-1.5 text-center font-bold tracking-widest uppercase shrink-0 mt-20">
        Made with ❤️ by Parmanand Singhal
      </div>
    </div>
  );
}
