import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <header className="glass sticky top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            South America Planner
          </h1>
          <div className="flex items-center space-x-4">
            {/* Auth / Settings controls will go here */}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mt-20">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Welcome to your collaborative journey
          </h2>
          <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
            Authentication and Map initialization are currently building. Stay tuned.
          </p>
        </div>
      </main>

      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
}

export default App;
