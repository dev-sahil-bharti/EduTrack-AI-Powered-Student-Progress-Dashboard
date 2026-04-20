// src/components/AIReportModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { label: 'Weekly Summary', key: 'summary' },
  { label: 'Study Recommendations', key: 'recommendations' },
  { label: 'Weak Areas', key: 'weak' },
  { label: 'Motivational Message', key: 'motivation' },
];

const parseSections = (text) => {
  if (!text) return {};

  const patterns = {
    summary: /1\.\s*Weekly Summary([\s\S]*?)(?=2\.\s*Study Recommendations|$)/i,
    recommendations: /2\.\s*Study Recommendations([\s\S]*?)(?=3\.\s*Weak Areas|$)/i,
    weak: /3\.\s*Weak Areas([\s\S]*?)(?=4\.\s*Motivational Message|$)/i,
    motivation: /4\.\s*Motivational Message([\s\S]*?)$/i,
  };

  const result = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    result[key] = match ? match[1].trim() : '';
  }
  return result;
};

const AIReportModal = ({ report, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!report) return null;

  const sections = parseSections(report.aiSummary);
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">AI Weekly Report</h2>
              <p className="text-slate-400 text-sm mt-0.5">{date}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {sections[activeTab] ? (
                  <div className="prose prose-invert prose-slate max-w-none
                    prose-headings:text-white prose-headings:font-semibold
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-headings:mt-6 prose-headings:mb-2
                    prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:text-slate-300 prose-ol:text-slate-300
                    prose-ul:mt-2 prose-ul:mb-4 prose-ol:mt-2 prose-ol:mb-4
                    prose-li:marker:text-purple-400 prose-li:mb-1
                  ">
                    <ReactMarkdown>{sections[activeTab]}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-10">
                    No content found for this section.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIReportModal;