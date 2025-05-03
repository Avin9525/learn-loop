import { Client, Account, Databases, Query, ID } from 'appwrite';
import { Question, Subject, Progress,QuestionData } from '../types/types';

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    throw new Error('Appwrite configuration is missing. Please check your .env.local file.');
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

//const account = new Account(client);
const databases = new Databases(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const QUESTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
export const SUBJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SUBJECTS_COLLECTION_ID;
export const PROGRESS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROGRESS_COLLECTION_ID;

if (!DATABASE_ID || !QUESTIONS_COLLECTION_ID || !SUBJECTS_COLLECTION_ID || !PROGRESS_COLLECTION_ID) {
    throw new Error('Appwrite collection IDs are missing. Please check your .env.local file.');
}

export const appwrite = {
    // Subject operations
    getSubjects: async () => {
        const response = await databases.listDocuments(
            DATABASE_ID,
            SUBJECTS_COLLECTION_ID
        );
        return response.documents as unknown as Subject[];
    },

    createSubject: async (subject: Omit<Subject, '$id'>) => {
        const response = await databases.createDocument(
            DATABASE_ID,
            SUBJECTS_COLLECTION_ID,
            ID.unique(),
            subject
        );
        return response as unknown as Subject;
    },

    updateSubject: async (subjectId: string, subject: Partial<Subject>) => {
        const response = await databases.updateDocument(
            DATABASE_ID,
            SUBJECTS_COLLECTION_ID,
            subjectId,
            subject
        );
        return response as unknown as Subject;
    },

    // Question operations
    createQuestion: async (question: Omit<Question, '$id'>) => {
        const response = await databases.createDocument(
            DATABASE_ID,
            QUESTIONS_COLLECTION_ID,
            'unique()',
            question
        );
        return response as unknown as Question;
    },

    createQuestions: async (questions: QuestionData[]) => {
        const promises = questions.map(question => 
            databases.createDocument(
                DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                'unique()',
              {
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                subject: question.subject
              }
            )
        );
        const responses = await Promise.all(promises);
        return responses as unknown as Question[];
    },


    createQuestionAndProgress: async (questions: QuestionData[]) => {
        const promises = questions.map(question => 
          { 
            const qId=ID.unique();
             databases.createDocument(
                DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                qId,
              {
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                subject: question.subject
              }
            )
             databases.createDocument(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                'unique()',
              {
                questionId: qId,
                subject: question.subject,
                tags: question.tags,
                correctCount: 0,
                wrongCount: 0,
                totalAttempts: 0,
                longTermScore: 0,
                middleTermScore: 0,
                shortTermScore: 0,
                easyRating: 3,
              }
            )
          }
        );
        const responses = await Promise.all(promises);
        return {
            questions: responses as unknown as Question[],
        };
    },
 

    async createProgress(progress: Omit<Progress, '$id'>): Promise<Progress |null > {
        try {
            const documentId = ID.unique();
            const response = await databases.createDocument(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                documentId,
                progress
            );

            return  response as unknown as Progress;
        } catch (error) {
            console.error('Error creating progress:', error);
            throw new Error('Failed to save progress');
        }
    },

   
    getQuestionsBySubject: async (subject: string) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                [
                    Query.equal('subject', subject),
                    Query.limit(100) // Increase limit to get more questions
                ]
            );
            return response.documents as unknown as Question[];
        } catch (error) {
            console.error('Error getting questions:', error);
            throw new Error('Failed to load questions');
        }
    },

    //  new Progress related functions
    getNewestProgress: async (limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting lowest attempt progress:', error);
            throw new Error('Failed to load progress documents with lowest attempts');
        }
    },

    getNewestProgressbyTag: async (tag:string, limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.search('tags', tag),
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting lowest attempt progress:', error);
            throw new Error('Failed to load progress documents with lowest attempts');
        }
    },

    getNewestProgressbySubject: async (subject:string, limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.equal('subject', subject),
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting lowest attempt progress:', error);
            throw new Error('Failed to load progress documents with lowest attempts');
        }
    },
    // Old progress related functions
    getOldProgress: async (limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.greaterThan('totalAttempts', 10), // Only get entries with more than minPoints
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting progress with minimum points:', error);
            throw new Error('Failed to load progress documents with minimum points');
        }
    },

    getOldProgressbyTag: async (tag:string, limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.search('tags', tag),
                    Query.greaterThan('totalAttempts', 10), // Only get entries with more than minPoints
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting progress with minimum points:', error);
            throw new Error('Failed to load progress documents with minimum points');
        }
    },

    getOldProgressbySubject: async (subject:string, limit: number = 10) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                [
                    Query.equal('subject', subject),
                    Query.greaterThan('totalAttempts', 10), // Only get entries with more than minPoints
                    Query.orderAsc('totalAttempts'), // Sort by attempt count (lowest first)
                    Query.limit(limit)
                ]
            );
            return response.documents as unknown as Progress[];
        } catch (error) {
            console.error('Error getting progress with minimum points:', error);
            throw new Error('Failed to load progress documents with minimum points');
        }
    },


    getQuestionsByProgress: async (progressList: Progress[]) => {
        try {
            const progressIds = progressList.map(progress => progress.questionId);
            const response = await databases.listDocuments(
                DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                [Query.equal('$id', progressIds)]
            );
            return response.documents as unknown as Question[];
        } catch (error) {
            console.error('Error getting questions by progress:', error);
            throw new Error('Failed to load questions by progress');
        }
    },
   


    updateProgress: async (progressId: string, progress: Partial<Progress>) => {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                PROGRESS_COLLECTION_ID,
                progressId,
                progress
            );
            return response as unknown as Progress;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw new Error('Failed to update progress');
        }
    },

    getQuestionById: async (id: string) => {
            const response = await databases.getDocument(
                DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                id
        );
        return response as unknown as Question;
    }
}; 