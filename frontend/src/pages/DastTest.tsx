import React from 'react';
import DastTestComponent from '../components/dast/DastTestComponent';

const DastTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 DAST Security Scanner Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the Dynamic Application Security Testing functionality
          </p>
        </div>
        <DastTestComponent />
      </div>
    </div>
  );
};

export default DastTest;
