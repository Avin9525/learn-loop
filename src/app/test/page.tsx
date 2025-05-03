'use client';


import { useState, useEffect } from 'react';
import { Question, Subject, Progress } from '../../types/types';
import { appwrite } from '../../lib/appwrite';
import { toast } from 'react-hot-toast';
import { progressService } from '@/lib/progressService';

export default function TestPage() {
    const [testStarted, setTestStarted] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>('allSubject');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [questionCount, setQuestionCount] = useState<number>(5);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [testCompleted, setTestCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    useEffect(() => {
        loadSubjects();
        
       
    }, []);

    useEffect(() => {
        if (testStarted && questions.length > 0) {
          setCurrentQuestion(questions[0]);
        }
      }, [questions, testStarted]);



    const loadSubjects = async () => {
        try {
            const subjects = await appwrite.getSubjects();
            setSubjects(subjects);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const randomizeQuestions = (questions: Question[]): Question[] => {
        return questions.map(question => {
            // Store the correct answer text
            const correctAnswerText = question.options[question.correctAnswer];
            
            // Create a copy of options and shuffle them
            const shuffledOptions = [...question.options];
            for (let i = shuffledOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
            }
            
            // Find the new index of the correct answer
            const newCorrectAnswerIndex = shuffledOptions.findIndex(option => option === correctAnswerText);
            
            // Return question with shuffled options and updated correct answer index
            return {
                ...question,
                options: shuffledOptions,
                correctAnswer: newCorrectAnswerIndex
            };
        });
    };

    const allQuestion = async () => {
        try {
            setIsLoading(true);
            const newQuestionNumber = Math.floor(questionCount/3);
            
            let newProgress: Progress[] = [];
            let olderProgress: Progress[] = [];
            
            // Check if we're fetching for all subjects or a specific subject
            if (selectedSubject === 'allSubject') {
                // Get questions across all subjects
                newProgress = await appwrite.getNewestProgress(newQuestionNumber);
            } else if (selectedTags.length > 0) {
                // If tags are selected, get questions for the specific subject and tags
                // This assumes you have a function to get by tags - you might need to implement this
                
                   newProgress = await appwrite.getNewestProgressbyTag(selectedTags[0], newQuestionNumber)
              
            } else {
                // Get questions for a specific subject
                newProgress = await appwrite.getNewestProgressbySubject(selectedSubject, newQuestionNumber);
            }


            //old question fetching


            const olderQuestionNumber = questionCount-newProgress.length;


            if (selectedSubject === 'allSubject') {
                // Get questions across all subjects
                olderProgress = await appwrite.getOldProgress(olderQuestionNumber);
            } else if (selectedTags.length > 0) {
                // If tags are selected, get questions for the specific subject and tags
                // This assumes you have a function to get by tags - you might need to implement this
                
                   olderProgress = await appwrite.getOldProgressbyTag(selectedTags[0], olderQuestionNumber)
              
            } else {
                // Get questions for a specific subject
                olderProgress = await appwrite.getNewestProgressbySubject(selectedSubject, olderQuestionNumber);
            }
            const combinedProgress = [...newProgress, ...olderProgress];
 
            const allQuestions = await appwrite.getQuestionsByProgress(combinedProgress);
            const randomizedQuestions = randomizeQuestions(allQuestions);
            setQuestions(randomizedQuestions);
            setProgress(combinedProgress);
            
            setIsLoading(false);
            
        } catch (error) {
            console.error(error);
        }
    };


    const startTest = async() => {
       await allQuestion();
       setTestStarted(true);
       setCurrentQuestionIndex(0);
       setScore(0);
       setTestCompleted(false);
      
    };


    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
           
            setCurrentQuestion(questions[currentQuestionIndex + 1]);
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setTestCompleted(true);
        }
    };



    const handleAnswer = (selectedIndex: number) => {
        if (selectedIndex === currentQuestion?.correctAnswer) {
            setScore(score + 1);
        }
        setShowExplanation(true);
        setSelectedOption(selectedIndex);
        progressService.calcAndUpdateProgress(progress, currentQuestion?.$id ?? null, selectedIndex===currentQuestion?.correctAnswer);
    };



    const resetTest = () => {
        setTestStarted(false);
        setSelectedSubject('allSubject');
        setSelectedTags([]);
        setTestCompleted(false);
        setCurrentQuestionIndex(0);
        setScore(0);
        setCurrentQuestion(null);
        setShowExplanation(false);
        setSelectedOption(null);
        setQuestionCount(5);
    };

    return (
        <div className="min-h-screen bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">MCQ Practice</h1>
                    <p className="text-gray-300">
                        Test your knowledge with spaced repetition
                    </p>
                </div>

                <div className="mt-8 space-y-8">
                    {/* Subject and Tag Selection */}
                    {!testStarted && (
                        <div className="bg-gray-800 shadow rounded-lg p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-medium text-white mb-2">Select Subject</h2>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
                                        setQuestions([]);
                                    }}
                                    className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                >
                                    <option value="allSubject">All Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.$id} value={subject.name}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <h2 className="text-lg font-medium text-white mb-2">Number of Questions</h2>
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                >
                                    <option value={5}>5 Questions</option>
                                    <option value={10}>10 Questions</option>
                                    <option value={15}>15 Questions</option>
                                    <option value={20}>20 Questions</option>
                                    <option value={25}>25 Questions</option>
                                    <option value={30}>30 Questions</option>
                                </select>
                            </div>

                            {selectedSubject && selectedSubject != "allSubject" &&(
                                <div>
                                    <h2 className="text-lg font-medium text-white mb-2">Select Tags</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {subjects.find(s => s.name === selectedSubject)?.tags.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1 rounded-full text-sm ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>
                    )}

                             {/* Start Test Button */}
                    { !testStarted && (
                        <div className="text-center">
                            <button
                                onClick={startTest}
                                disabled={isLoading || !selectedSubject}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Test
                            </button>
                        </div>
                    )}


                    {/* Question Display */}
                  
                  { currentQuestion && !testCompleted && (
                        <div className="bg-gray-800 shadow rounded-lg p-6">
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-white">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </h3>
                                    <span className="text-sm text-gray-400">
                                        Score: {score}/{currentQuestionIndex + 1}
                                    </span>
                                </div>
                                <p className="text-gray-300 mb-6">{currentQuestion.question}</p>
                                
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => !showExplanation && handleAnswer(index)}
                                            className={`w-full p-3 text-left rounded-md ${
                                                showExplanation
                                                    ? index === currentQuestion.correctAnswer
                                                        ? 'bg-green-100 text-green-800 font-semibold'
                                                        : selectedOption === index
                                                        ? 'bg-red-100 text-red-800 font-semibold'
                                                        : 'bg-gray-700 text-gray-300'
                                                    : selectedOption === index
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {showExplanation && (
                                <div className="mt-6">
                                    <h4 className="text-md font-medium text-white mb-2">Explanation</h4>
                                    <p className="text-gray-300 mb-4">{currentQuestion.explanation}</p>
                                    <button
                                        onClick={nextQuestion}
                                        className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {testCompleted && (
                        <div className="bg-gray-800 shadow rounded-lg p-6 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Test Completed!</h2>
                            <p className="text-gray-300 mb-6">
                                Your score: {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
                            </p>
                            <button
                                onClick={resetTest}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Start New Test
                            </button>
                        </div>
                    )}
                            
                  
                </div>
            </div>
        </div>
    );






}