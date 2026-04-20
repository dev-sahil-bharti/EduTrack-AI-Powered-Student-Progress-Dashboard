import React, { useEffect, useState } from 'react';
import { aiService } from '../services/ai.service';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const Insights = () => {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await aiService.getReports();
      setReports(res.data || res || []);
    } catch (err) {
      // toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await aiService.generateWeeklyReport();
      toast.success('AI Report generated successfully!');
      fetchReports();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to generate report. Need more study data!';
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-purple-400" size={32} />
            AI Insights
          </h1>
          <p className="text-slate-400 mt-1">Personalized analyses based on your study habits.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl transition-all font-medium hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
        >
          {generating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          <span>Generate New Report</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading your brain waves...</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <Sparkles className="h-16 w-16 text-slate-600 mb-6 relative z-10" />
          <h3 className="text-xl font-bold text-white relative z-10">No insights yet</h3>
          <p className="text-slate-400 max-w-sm mt-2 relative z-10">
            Log some progress and track goals throughout the week, then come back here to generate a deep-dive AI analysis of your performance!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.map((report, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={report._id || idx}
              className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm font-bold tracking-wider uppercase rounded-full border border-purple-500/20">
                  Weekly Summary
                </div>
                <span className="text-slate-500 text-sm">
                  {new Date(report.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>

              {/* ✅ Markdown rendered properly */}
              <div className="prose prose-invert prose-slate max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-headings:mt-6 prose-headings:mb-2
                  prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:text-slate-300 prose-ol:text-slate-300
                  prose-ul:mt-2 prose-ul:mb-4 prose-ol:mt-2 prose-ol:mb-4
                  prose-li:marker:text-purple-400 prose-li:mb-1
                  prose-blockquote:border-purple-500 prose-blockquote:text-slate-400
                ">
                <ReactMarkdown>{report.aiSummary}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insights;