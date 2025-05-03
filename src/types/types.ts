

export interface Question {
    $id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    subject: string;
}

export interface Subject {
    $id: string;
    name: string;
    tags: string[];
}

export interface Progress {
    $id: string;
    questionId: string;
    subject: string;
    tags: string[];
    correctCount: number;
    wrongCount: number;
    totalAttempts: number;
    longTermScore: number;
    middleTermScore: number;
    shortTermScore: number;
    easyRating: number;
}

export interface QuestionData {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    subject: string;
    tags: string[];
}