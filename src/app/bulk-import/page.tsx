'use client';

import { useState, useEffect } from 'react';
import { Subject, QuestionData } from '../../types/types';
import { appwrite } from '../../lib/appwrite';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function BulkImport() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [newSubject, setNewSubject] = useState<string>('');
    const [newTag, setNewTag] = useState<string>('');
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [jsonInput, setJsonInput] = useState<string>('');

    useEffect(() => {
        loadSubjects();
       
    }, []);

    // Update questions with default tag when it changes
   

    const loadSubjects = async () => {
        try {
            const subjects = await appwrite.getSubjects();
            setSubjects(subjects);

        } catch (error) {
            toast.error('Failed to load subjects');
            console.error(error);
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) {
            toast.error('Subject name cannot be empty');
            return;
        }

        try {
            const subject = await appwrite.createSubject({
                name: newSubject.trim(),
                tags: []
            });
            setSubjects([...subjects, subject as Subject]);
            setSelectedSubject(subject.name);
            setNewSubject('');
            toast.success('Subject added successfully');
        } catch (error) {
            toast.error('Failed to add subject');
            console.error(error);
        }
    };

    const handleAddTag = async (subject:string, tag:string) => {
        if (!subject || !tag.trim()) {
            toast.error('Please select a subject and enter a tag');
            return;
        }

        try {
            const sub = subjects.find(s => s.name === subject);
            if (!sub) return;
            const updatedTags = [...sub.tags, newTag.trim()];
            await appwrite.updateSubject(sub.$id, { tags: updatedTags });
            
            setSubjects(subjects.map(s => 
                s.$id === sub.$id ? { ...s, tags: updatedTags } : s
            ));
            setNewTag('');
            toast.success('Tag added successfully');
        } catch (error) {
            toast.error('Failed to add tag');
            console.error(error);
        }
    };
   
    const handleJsonImport = () => {
        try {
            const importedQuestions = JSON.parse(jsonInput);
            if (Array.isArray(importedQuestions)) {
                setQuestions(importedQuestions.map(q => ({
                    ...q,
                    subject: selectedSubject,
                   tags: selectedTag ? [...new Set([...(q.tags || []), selectedTag])] : (q.tags || []) 
                })));
                toast.success('Questions imported successfully');
                setJsonInput('');
            } else {
                toast.error('Invalid JSON format. Please provide an array of questions.');
            }
        } catch (error) {
            toast.error('Error parsing JSON. Please check the format.');
            console.error(error);
        }
    };


    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);
                if (Array.isArray(jsonData)) {
                    setQuestions(jsonData.map(q => ({
                        ...q,
                        subject: selectedSubject,
                        tags: selectedTag ? [...new Set([...(q.tags || []), selectedTag])] : (q.tags || [])
                    })));
                    toast.success('Questions imported successfully');
                } else {
                    toast.error('Invalid JSON format. Please upload an array of questions.');
                }
            } catch (error) {
                toast.error('Error parsing JSON file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        setQuestions([]);
        setJsonInput('');
        setSelectedTag('');
        toast.success('Form reset successfully');
    };

   

    const handleSaveQuestions = async () => {
    

        setIsLoading(true);
        try {
            // First, update all subjects with new tags
            await appwrite.createQuestionAndProgress(questions);
            
            setQuestions([]);
            toast.success('Questions imported successfully');
        } catch (error) {
            toast.error('Failed to import questions');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        toast.success('Question deleted');
    };

    const handleUpdateQuestion = (index: number, field: keyof Omit<QuestionData, '$id'>, value: unknown) => {
        setQuestions(questions.map((q, i) => {
            if (i === index) {
                // If subject is being changed, clear all tags
                if (field === 'subject') {
                    return { 
                        ...q, 
                        subject: value as string, 
                        tags: value === selectedSubject && selectedTag ? [selectedTag] : [] 
                    };
                }
                return { ...q, [field]: value };
            }
            return q;
        }));
    };

   
    const handleAddTagToQuestion = async (index: number, tag: string) => {
        if (!tag.trim()) return;
        const question = questions[index];
        const subject = subjects.find(s => s.name === question.subject);
        
        if (!subject) {
            toast.error('Please select a subject first');
            return;
        }

        const newTag = tag.trim();
        if (!question.tags.includes(newTag)) {
            // Update question tags
            handleUpdateQuestion(index, 'tags', [...question.tags, newTag]);

            // Update subject tags if the tag is new
            if (!subject.tags.includes(newTag)) {
                try {
                    const updatedTags = [...subject.tags, newTag];
                    await appwrite.updateSubject(subject.$id, { tags: updatedTags });
                    
                    // Update local subjects state
                    setSubjects(subjects.map(s => 
                        s.$id === subject.$id ? { ...s, tags: updatedTags } : s
                    ));
                    
                    toast.success('Tag added to subject');
                } catch (error) {
                    toast.error('Failed to update subject tags');
                    console.error(error);
                }
            }
        }
    };
    const handleRemoveTagFromQuestion = (index: number, tagToRemove: string) => {
        const question = questions[index];
        handleUpdateQuestion(index, 'tags', question.tags.filter(tag => tag !== tagToRemove));
    };

  

 

    return (
        <div className="min-h-screen bg-gray-900 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">Bulk Import Questions</h1>
                    <Link 
                        href="/question-format" 
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                        <span>View Question Format Documentation</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
                <div className="text-center">
                    <p className="text-gray-300">
                        Import multiple questions in JSON format and manage them before saving
                    </p>
                </div>

                <div className="mt-8 space-y-8">
                    {/* Subject Management */}
                    <div className="bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-white mb-4">Subject Management</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Select Subject
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                >
                                    <option value="">Select a subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.$id} value={subject.name}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Add new subject */}
                            <div className= "mt4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Add New Subject
                                </label>
                                 <div className="flex space-x-2">
                            
                                    <input
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="New subject name"
                                        className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400"
                                     />
                                    <button
                                    onClick={handleAddSubject}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                     >
                                    Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* tag selection*/}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Select Default Tag
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                    className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                >
                                    <option value="">No default tag</option>
                                    {selectedSubject && subjects.find(s => s.name === selectedSubject)?.tags.map((tag) => (
                                        <option key={tag} value={tag}>
                                            {tag}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                         {/*Add new tag*/}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Add New Tag
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="New tag"
                                    className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white placeholder-gray-400"
                                />
                                <button
                                    onClick={() => handleAddTag(selectedSubject, newTag)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {selectedSubject && subjects.find(s => s.name === selectedSubject)?.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* File Upload and JSON Input */}
                    <div className="bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-white mb-4">Import Questions</h2>
                        <div className="space-y-6">
                            {/* JSON Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Paste Questions in JSON Format
                                </label>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full h-40 p-3 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                    placeholder="Paste your questions in JSON format here..."
                                />
                                <button
                                    onClick={handleJsonImport}
                                    className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Import Questions
                                </button>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Or Upload JSON File
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-gray-300
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-indigo-600 file:text-white
                                            hover:file:bg-indigo-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions Preview */}
                    {questions.length > 0 && (
                        <div className="bg-gray-800 shadow rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-white"> Questions Preview </h2>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSaveQuestions}
                                        disabled={isLoading}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Saving...' : 'Save All Questions'}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {questions.map((question, index) => (
                                    <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 space-y-4">
                                                {/* Subject Selection */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                                                    <select
                                                        value={question.subject}
                                                        onChange={(e) => handleUpdateQuestion(index, 'subject', e.target.value)}
                                                        className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                    >
                                                        <option value="">Select a subject</option>
                                                        {subjects.map((subject) => (
                                                            <option key={subject.$id} value={subject.name}>
                                                                {subject.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Question Text */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">Question</label>
                                                    <textarea
                                                        value={question.question}
                                                        onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                                                        className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                        rows={2}
                                                    />
                                                </div>

                                                {/* Options */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">Options</label>
                                                    <div className="space-y-2">
                                                        {question.options.map((option, optIndex) => (
                                                            <div key={optIndex} className="flex items-center space-x-3">
                                                                <input
                                                                    type="radio"
                                                                    checked={question.correctAnswer === optIndex}
                                                                    onChange={() => handleUpdateQuestion(index, 'correctAnswer', optIndex)}
                                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...question.options];
                                                                        newOptions[optIndex] = e.target.value;
                                                                        handleUpdateQuestion(index, 'options', newOptions);
                                                                    }}
                                                                    className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Explanation */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">Explanation</label>
                                                    <textarea
                                                        value={question.explanation}
                                                        onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                                                        className="w-full p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                        rows={2}
                                                    />
                                                </div>

                                                {/* Tags */}                                               
                                                 <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                                                    <div className="flex space-x-2">
                                                        <select
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    handleAddTagToQuestion(index, e.target.value);
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                        >
                                                            <option value="">Select a tag</option>
                                                            {question.subject && subjects.find(s => s.name === question.subject)?.tags.map((tag) => (
                                                                <option key={tag} value={tag}>
                                                                    {tag}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder="New tag"
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleAddTagToQuestion(index, (e.target as HTMLInputElement).value);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }}
                                                            className="flex-1 p-2 border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                                                        />
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {question.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200"
                                                            >
                                                                {tag}
                                                                <button
                                                                    onClick={() => handleRemoveTagFromQuestion(index, tag)}
                                                                    className="ml-1 text-indigo-300 hover:text-indigo-100"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div> 
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuestion(index)}
                                                className="ml-4 p-2 text-red-400 hover:text-red-300"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 