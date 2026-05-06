export type QuestionType = 'single' | 'multiple' | 'numeric';

export interface SectionConfig {
  id: string;
  name: string;
  type: QuestionType;
  numQuestions: number;
  positiveMarks: number;
  negativeMarks: number;
  partialMarking?: boolean;
}

export interface SubjectConfig {
  id: string;
  name: string;
  sections: SectionConfig[];
}

export interface TestConfiguration {
  pdfUrl: string | null;
  pdfName?: string;
  subjects: SubjectConfig[];
  totalQuestions: number;
  totalTimeMinutes: number;
}

export interface QuestionResponse {
  value: string | string[];
  timeSpent: number; // seconds spent on this specific question
  markedAt: number; // absolute seconds from start of test when this was last updated
  isMarkedForReview: boolean;
}

export interface ResponseMap {
  [questionId: string]: QuestionResponse;
}

export interface AnswerKeyMap {
  [questionId: string]: string | string[];
}

export type TestStatus = 'setup' | 'testing' | 'answering' | 'results' | 'history';

export interface SavedTest {
  id: string;
  date: string;
  config: TestConfiguration;
  responses: ResponseMap;
  answerKey: AnswerKeyMap;
  totalScore: number;
}
