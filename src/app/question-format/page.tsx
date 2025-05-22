'use client';

import Link from 'next/link';

export default function QuestionFormat() {
  const exampleJson = [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": 2,
      "explanation": "Paris is the capital city of France."
    },
    {
      "question": "Which planet is known as the Red Planet?",
      "options": ["Venus", "Mars", "Jupiter", "Saturn"],
      "correctAnswer": 1,
      "explanation": "Mars is called the Red Planet due to its reddish appearance."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link 
          href="/bulk-import" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Bulk Import
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Question Format Documentation</h1>

      {/* Overview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-gray-600 mb-4">
          This documentation explains the format for importing questions into the system. 
          Questions can be imported in bulk using JSON format, which allows for efficient 
          management of large question sets.
        </p>
      </section>

      {/* JSON Format Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">JSON Format</h2>
        <p className="text-gray-600 mb-4">
          Your JSON text should contain an array of question objects with the following structure:
        </p>
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">
            {JSON.stringify(exampleJson, null, 2)}
          </pre>
        </div>
      </section>

      {/* Field Descriptions */}
      

      {/* Best Practices */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ul className="list-disc pl-5 space-y-3 text-gray-600">
            <li>Keep questions clear and concise</li>
            <li>Ensure all options are plausible and of similar length</li>
            <li>Provide detailed explanations that help users understand the concept</li>
            <li>Use consistent formatting and punctuation</li>
            <li>Include 4 options for each question when possible</li>
            <li>Make sure the correctAnswer index matches the position of the correct option</li>
          </ul>
        </div>
      </section>

      {/* Validation Rules */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Validation Rules</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ul className="list-disc pl-5 space-y-3 text-gray-600">
            <li>Question text cannot be empty</li>
            <li>Must have at least 2 options</li>
            <li>correctAnswer must be a valid index (0 to options.length - 1)</li>
            <li>Explanation cannot be empty</li>
            <li>All options must be unique</li>
          </ul>
        </div>
      </section>

      {/* Import Instructions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How to Import</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ol className="list-decimal pl-5 space-y-3 text-gray-600">
            <li>Prepare your questions in the JSON format shown above</li>
            <li>Go to the <Link href="/bulk-import" className="text-blue-600 hover:text-blue-800">Bulk Import</Link> page</li>
            <li>Either paste your JSON directly into the text area or upload a JSON file</li>
            <li>Select the appropriate subject and tags</li>
            <li>Click "Import Questions" to add them to the system</li>
          </ol>
        </div>
      </section>

      {/* Matching Questions Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Matching Questions Format</h2>
        <p className="text-gray-600 mb-4">
          For matching questions, use the following format. This is particularly useful for matching items from two lists:
        </p>
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">
{`{
  "question": "निम्नलिखित अधिनियमों को सही ढंग से मिलाइए:\\nसूची-I\\nA. भारत सरकार अधिनियम, 1919\\nB. भारत सरकार अधिनियम, 1935\\nC. मिंटो-मार्ले सुधार, 1909\\nD. भारत परिषद् अधिनियम, 1861\\nE. भारत सरकार अधिनियम, 1858\\nसूची-II\\n1. प्रान्तीय स्वायत्तता\\n2. सती प्रथा का अन्त\\n3. प्रान्तों में द्वैध शासन\\n4. साम्प्रदायिक निर्वाचन\\n5. ब्रिटिश शासन शक्ति में आया",
  "options": ["A-3, B-1, C-4, D-5, E-2", "A-1, B-3, C-2, D-4, E-5", "A-3, B-1, C-4, D-5, E-2", "A-5, B-2, C-1, D-3, E-4"],
  "correctAnswer": 0,
  "explanation": "सही मिलान है:\\nA. भारत सरकार अधिनियम, 1919 - 3. प्रान्तों में द्वैध शासन... [detailed explanation]"
}`}
          </pre>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-3">Matching Question Guidelines:</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Use clear list labels (e.g., List-I, List-II)</li>
            <li>Number or letter the items in each list (e.g., A, B, C or 1, 2, 3)</li>
            <li>Format options as comma-separated pairs (e.g., "A-1, B-2, C-3")</li>
            <li>Provide detailed explanations for each correct match</li>
            <li>Ensure all items from both lists are used in the correct answer</li>
            <li>Include distractors that are plausible but incorrect</li>
          </ul>
        </div>
      </section>

      {/* Choose Incorrect Option Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Choose the Incorrect Option Format</h2>
        <p className="text-gray-600 mb-4">
          For questions that ask to identify the incorrect option from a list of correct statements:
        </p>
        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">
{`{
  "question": "1946 का कैबिनेट मिशन तीन मंत्रियों से गठित था। निम्नलिखित में से कौन इसका सदस्य नहीं था ?",
  "options": [
    "लॉर्ड पैथिक लॉरेंस",
    "ए. वी. अलेक्जेंडर",
    "सर स्टैफर्ड क्रिप्स",
    "लॉर्ड एमरी"
  ],
  "correctAnswer": 3,
  "explanation": "1946 का कैबिनेट मिशन तीन ब्रिटिश मंत्रियों - लॉर्ड पैथिक लॉरेंस (भारत के राज्य सचिव), ए. वी. अलेक्जेंडर (एडमिरल्टी के पहले लॉर्ड) और सर स्टैफर्ड क्रिप्स (बोर्ड ऑफ ट्रेड के अध्यक्ष) से बना था। लॉर्ड एमरी इस मिशन के सदस्य नहीं थे।"
}`}
          </pre>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-3">Guidelines for "Choose the Incorrect Option" Questions:</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Question should clearly indicate that one option is incorrect</li>
            <li>All other options should be factually correct</li>
            <li>Incorrect option should be plausible but clearly wrong</li>
            <li>Explanation should justify why the chosen option is incorrect</li>
            <li>Include relevant historical/contextual details in the explanation</li>
            <li>Make sure the correctAnswer index points to the incorrect option</li>
          </ul>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Question Structure Tips:</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Start with a clear context (e.g., "1946 का कैबिनेट मिशन...")</li>
              <li>Use phrases like "निम्नलिखित में से कौन सही नहीं है?" or "कौन इसका सदस्य नहीं था?"</li>
              <li>Ensure all correct options are equally significant</li>
              <li>Make the incorrect option subtly different to test understanding</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
