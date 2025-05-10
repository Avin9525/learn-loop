'use client';

import { useState, useEffect } from 'react';
import { Question, Subject, Progress } from '../../types/types';
import { appwrite } from '../../lib/appwrite';
import { progressService } from '../../lib/progressService';
//import { toast } from 'react-hot-toast';

import dynamic from 'next/dynamic';
import {  Tags, BrainCircuit, Trash2 } from 'lucide-react';
import { Check, X } from 'lucide-react';

interface AnswerOptionProps {
    option: string;
    index: number;
    selected: boolean;
    disabled: boolean;
    showCorrect: boolean;
    isCorrect: boolean;
    onSelect: (index: number) => void;
}

// Import ThemeToggle with no SSR
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle').then(mod => mod.ThemeToggle), { 
  ssr: false 
});

// Add this at the top of the file, after the imports
const styles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
`;

// AnswerOption component
const AnswerOption = ({ option, index, selected, disabled, showCorrect, isCorrect, onSelect }: AnswerOptionProps) => {
  const showResult = showCorrect && (selected || isCorrect);
  const isWrong = showCorrect && selected && !isCorrect;

  // Add useEffect to inject styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={disabled}
      className={`w-full p-4 text-left rounded-lg border transition-all duration-300 ${
        selected
          ? isCorrect && showCorrect
            ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 shadow-md'
            : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : isCorrect && showCorrect
          ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-gray-600'
      } ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
      } ${
        isWrong ? 'animate-shake' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isCorrect && showCorrect
            ? 'bg-green-500 text-white border-none'
            : selected 
              ? 'border-2 border-indigo-500 bg-white dark:bg-gray-800'
              : 'border-2 border-gray-300 dark:border-gray-600'
        }`}>
          {showResult && (
            isCorrect ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <X className="w-4 h-4 text-red-500" />
            )
          )}
        </div>
        <span className={`transition-all duration-300 ${
          isCorrect && showCorrect 
            ? 'font-medium text-green-800 dark:text-green-300'
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          {option}
          {isCorrect && showCorrect && (
            <span className="block mt-1 text-sm font-normal text-green-600 dark:text-green-400">
              ✓ Correct answer
            </span>
          )}
        </span>
      </div>
    </button>
  );
};

export default function mcqLoop(){
    const [isConfiguringSettings, setIsConfiguringSettings] = useState<boolean>(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newQuestionNumber, setNewQuestionNumber] = useState<number>(10);
    const [oldQuestionNumber, setOldQuestionNumber] = useState<number>(10);
    // Add this to prevent hydration mismatch
    const [isClient, setIsClient] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [progress, setProgress] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showCorrect, setShowCorrect] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [noOfTimesRight, setNoOfTimesRight] = useState<number[]>([0])
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    useEffect(() => {
        // Mark that we're on the client
        setIsClient(true);
        loadSubjects();
    }, []);
   
    const loadSubjects = async () => {
        try {
            const subjects = await appwrite.getSubjects();
            console.log(subjects);
            setSubjects(subjects);
        } catch (error) {
            console.error(error);
        }
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
    const startQuiz = async() => {
      let newProgress: Progress[] = [];
      let olderProgress: Progress[] = [];  
      if(newQuestionNumber>0) {
       newProgress = await appwrite.getNewestProgressbyTag(selectedTags[0], newQuestionNumber);
      }
      if(oldQuestionNumber>0){
       olderProgress = await appwrite.getOldProgressbyTag(selectedTags[0], oldQuestionNumber);
      }
       const combinedProgress = [...newProgress, ...olderProgress];
       const allQuestions = await appwrite.getQuestionsByProgress(combinedProgress);
       const randomizedQuestions = randomizeQuestions(allQuestions);
       
       // Initialize noOfTimesRight with the correct length based on randomizedQuestions
       setNoOfTimesRight(Array(randomizedQuestions.length).fill(0));
       
       // Now set the questions state
       setQuestions(randomizedQuestions);
       setIsConfiguringSettings(false);
    };

    // Only render the actual content when we're on the client
    if (!isClient) {
        return <div className="min-h-screen bg-gray-100 dark:bg-gray-900"></div>;
    }

    const renderContent = () => {

        // If configuring settings
        if (isConfiguringSettings) {
          return (
            <div className="w-full max-w-3xl mx-auto py-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                Quiz Settings
              </h2>
              <div>
                <h2 className="text-lg font-medium text-white mb-2">Select Subject</h2>
                <select
                                    value={selectedSubject}
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
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
              {/* Quiz Mode Selection */}
             
      
              {/* Tags Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Tags size={20} />
                  <span>Select Topics</span>
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {subjects.find(s => s.name === selectedSubject)?.tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags(prevTags => {
                            if (prevTags.includes(tag)) {
                              return prevTags.filter(t => t !== tag);
                            } else {
                              return [...prevTags, tag];
                            }
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
      
              {/* Question Count */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Number of New Questions
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={newQuestionNumber}
                    onChange={(e) => setNewQuestionNumber(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                  </div>
                  
                  <div className="text-center mt-2 text-gray-700 dark:text-gray-300">
                    Selected: {newQuestionNumber} questions
                  </div>
                </div>
              </div>

              {/*Old Question count*/}

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Number of Old Questions
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={oldQuestionNumber}
                    onChange={(e) => setOldQuestionNumber(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span>0</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                  </div>
                  
                  <div className="text-center mt-2 text-gray-700 dark:text-gray-300">
                    Selected: {oldQuestionNumber} questions
                  </div>
                </div>
              </div>
              
              {/* Time Settings (for Timed mode) */}
              
              
              {/* Additional Options */}
          
              
              {/* Start Button */}
              <button
                onClick={startQuiz}
                disabled={selectedTags.length === 0}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                  selectedTags.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white'
                }`}
              >
                {selectedTags.length === 0 ? 'Select at least one topic' : 'Start Quiz'}
              </button>
            </div>
            </div>
            );
        
        }
        
      
        
        // If all questions have been mastered
        if (isCompleted) {
            return (
                <div className="w-full max-w-3xl mx-auto py-20">
                    <div className="w-full max-w-3xl mx-auto animate-fadeIn bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-10 text-center">
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-12 h-12 text-green-500" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                Drill Completed!
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Congratulations! You've successfully mastered all questions in this drill.
                            </p>
                        </div>
                        
                        <button
                            onClick={restartQuiz}
                            className="px-8 py-3 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Restart Quiz Loop
                        </button>
                    </div>
                </div>
            );
        }
        
        // If taking the quiz
        return (
          <div className="w-full max-w-3xl mx-auto py-20">
            {/* Quiz Header */}
           
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <BrainCircuit size={28} className="text-indigo-600 dark:text-indigo-400" />
                <span>QuizMaster</span>
              </h1>
            </div>
            {/* Progress Tracking */}
          
            <div className="mb-6 w-full">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                         Question {currentQuestionIndex+1} of {questions.length}
                     </span>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                         {Math.round(progress)}% Complete
                     </span>
                 </div>
      
             {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  />
             </div>
            
            {/* Current Question */}
            
            <div className="w-full max-w-3xl mx-auto animate-fadeIn bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 mb-4 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                        Question {currentQuestionIndex+1} of {questions.length}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 min-h-[3rem] leading-tight">
                        {questions[currentQuestionIndex]?.question}
                    </h2>

                    <div className="space-y-3 min-h-[200px]">
                        {questions[currentQuestionIndex]?.options.map((option, index) => (
                            <AnswerOption
                                key={index}
                                option={option}
                                index={index}
                                selected={selectedOption === index}
                                disabled={disabled}
                                showCorrect={showCorrect}
                                isCorrect={index === questions[currentQuestionIndex]?.correctAnswer}
                                onSelect={onSelectOption}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Show explanation when revealing answers */}
                <div className="min-h-[100px]">
                    {showCorrect && questions[currentQuestionIndex]?.explanation && (
                        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                                <BrainCircuit size={18} className="mr-2" />
                                Explanation:
                            </h3>
                            <p className="text-blue-700 dark:text-blue-200">{questions[currentQuestionIndex].explanation}</p>
                        </div>
                    )}
                </div>

                {/* Next Button and Delete Button */}
                <div className="mt-8 flex justify-between min-h-[40px]">
                    {showCorrect && (
                        <>
                            <button
                                onClick={handleDeleteQuestion}
                                className="px-6 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                <span>Delete Question</span>
                            </button>
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Next Question
                            </button>
                        </>
                    )}
                </div>
            </div>
          
            
            {/* Navigation Controls */}
           
            </div>
        </div>
        );
      };

    const onSelectOption = (index: number) => {
        if (disabled) return;
        
        setSelectedOption(index);
        setDisabled(true);
        setShowCorrect(true);
        
        // Check if selected option is correct
        const isCorrect = index === questions[currentQuestionIndex]?.correctAnswer;
        
        // If the answer is correct, update the correct count for this question
        const updatedNoOfTimesRight = [...noOfTimesRight];
        if (isCorrect) {
            
            updatedNoOfTimesRight[currentQuestionIndex] = (updatedNoOfTimesRight[currentQuestionIndex] || 0) + 1;
        }else{
          updatedNoOfTimesRight[currentQuestionIndex] = 0;
        }
            setNoOfTimesRight(updatedNoOfTimesRight);
        
        
        // Update progress
        const newProgress = ((currentQuestionIndex + 1) / questions.length) * 100;
        setProgress(newProgress);
    };

    const handleNextQuestion = () => {
        // Log the current number of times this question was answered correctly
        console.log(`Question ${currentQuestionIndex + 1} answered correctly ${noOfTimesRight[currentQuestionIndex] || 0} times`);
        
        // Check if any questions need to be removed (answered correctly 4 or more times)
        const questionsToKeep = questions.filter((_, index) => 
            (noOfTimesRight[index] || 0) < 3
        );
        
        if(noOfTimesRight[currentQuestionIndex] >= 3){
          console.log(questions[currentQuestionIndex].$id);
          progressService.updateProgressFromMcqLoop(questions[currentQuestionIndex].$id);
        };
        
        // Create a new array of correct counts that matches the filtered questions
        const updatedNoOfTimesRight = questionsToKeep.map((_, index) => {
            const originalIndex = questions.findIndex(q => q.$id === questionsToKeep[index].$id);
            return noOfTimesRight[originalIndex] || 0;
        });
        
        // Check if all questions are completed
        if (questionsToKeep.length === 0) {
            setIsCompleted(true);
            return;
        }
        
        // If we removed any questions, update the questions array and correct counts
        if (questionsToKeep.length < questions.length) {
            setQuestions(questionsToKeep);
            setNoOfTimesRight(updatedNoOfTimesRight);
            
            // If we're at the end, go back to the beginning
            if (currentQuestionIndex >= questionsToKeep.length - 1) {
                setCurrentQuestionIndex(0);
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        } else {
            // No questions removed, proceed normally
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setCurrentQuestionIndex(0);
                const randomizedQuestions = randomizeQuestions(questions);
                setQuestions(randomizedQuestions);
            }
        }
        
        setSelectedOption(null);
        setDisabled(false);
        setShowCorrect(false);
    };

    const handleDeleteQuestion = () => {
        // Only allow deleting if there's more than one question
        if (questions.length <= 1) return;
        
        // Create a new array without the current question
        const updatedQuestions = questions.filter((_, index) => index !== currentQuestionIndex);
        
        // Create a new array of correct counts without the current question
        const updatedNoOfTimesRight = noOfTimesRight.filter((_, index) => index !== currentQuestionIndex);
        
        // Update the questions array
        setQuestions(updatedQuestions);
        setNoOfTimesRight(updatedNoOfTimesRight);
        
        // If we're deleting the last question, go back to the previous one
        if (currentQuestionIndex >= updatedQuestions.length) {
            setCurrentQuestionIndex(updatedQuestions.length - 1);
        }
        
        // Update progress
        const newProgress = ((currentQuestionIndex + 1) / updatedQuestions.length) * 100;
        setProgress(newProgress);
        
        // Check if all questions are completed
        if (updatedQuestions.length === 0) {
            setIsCompleted(true);
            return;
        }
        
        // Reset the state for the next question
        setSelectedOption(null);
        setDisabled(false);
        setShowCorrect(false);
    };

    // Add a restart function
    const restartQuiz = () => {
        setIsCompleted(false);
        setIsConfiguringSettings(true);
        setSelectedOption(null);
        setDisabled(false);
        setShowCorrect(false);
        setProgress(0);
        setNoOfTimesRight([0]);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-8 px-4">
          <div className="w-full max-w-4xl mx-auto">
            {/* Fixed position theme toggle when not in quiz */}
            {( isConfiguringSettings) && (
             <div className="absolute top-4 right-4">
                <ThemeToggle />
              </div> 
            )}  
            
            {renderContent()}
          </div>
        </div>
      );




}