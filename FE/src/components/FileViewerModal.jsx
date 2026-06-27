import { useState } from 'react';
import api from '../api.js';

const MOCK_DOCUMENTS = {
  'agile-performance-report.pdf': {
    title: 'Agile Performance Report 2026',
    subtitle: 'A Quantitative Study on Sprint Cycles and Delivery Performance',
    sections: [
      {
        heading: '1. Executive Summary',
        paragraphs: [
          'This report analyzes the adoption of agile frameworks across software organizations in 2026. The empirical study focuses on deployment velocity, sprint predictability, and team satisfaction.',
          'Key Finding: Organizations that combine lightweight sprint methodologies with strong automation release software 4x more frequently than peers using ad-hoc processes.'
        ]
      },
      {
        heading: '2. Velocity and Blockage Metrics',
        paragraphs: [
          'Daily standup meetings remain the primary tool for identifying development blocks. In our surveyed cohorts, teams that enforce standard 15-minute daily retrospectives solved blocker issues within an average of 18 hours, compared to 72 hours for teams using ad-hoc slack coordination.',
          'We note that informal message channels often cause requirements drift, leading to a 25% increase in technical design rework.'
        ]
      }
    ]
  },
  'devops-adoption-metrics.pdf': {
    title: 'State of DevOps Adoption and Quality Metrics',
    subtitle: 'Automated Testing, Continuous Integration, and Peer Reviews',
    sections: [
      {
        heading: '1. Test Automation and Regression Control',
        paragraphs: [
          'Automated testing is crucial for continuous delivery. Running test suites automatically on every pull request reduces critical production bugs by 40% and keeps release regressions near zero.',
          'Refactoring legacy code minimizes long-term technical debt. Our metrics indicate that dedicating 15% of sprint capacity to automated code refactoring sustains a long-term development velocity of 90%.'
        ]
      },
      {
        heading: '2. Code Review and Knowledge Distribution',
        paragraphs: [
          'Peer code reviews before merging pull requests serve as both a gatekeeper and a knowledge transfer mechanism. Analysis shows that peer reviews identify 60% of critical architecture defects before staging.',
          'Test suites integrated directly into the CI/CD pipeline ensure that refactored codebase changes do not break legacy dependencies.'
        ]
      }
    ]
  },
  'scrum-guide-2020.pdf': {
    title: 'The Scrum Guide 2020',
    subtitle: 'The Definitive Guide to Scrum: The Rules of the Game',
    sections: [
      {
        heading: 'Scrum Definition',
        paragraphs: [
          'Scrum is a lightweight framework that helps people, teams and organizations generate value through adaptive solutions for complex problems.',
          'It is built on the empirical pillars of transparency, inspection, and adaptation.'
        ]
      },
      {
        heading: 'The Sprint Retrospective',
        paragraphs: [
          'The purpose of the Sprint Retrospective is to plan ways to increase quality and effectiveness.',
          'The Scrum Team inspects how the last Sprint went with regards to individuals, interactions, processes, tools, and their Definition of Done.'
        ]
      }
    ]
  },
  'instructor-agile-risk-framework.pdf': {
    title: 'Agile Software Risk & Compliance Framework',
    subtitle: 'Instructor-curated reference for academic software auditing',
    sections: [
      {
        heading: '1. Regulatory Audit and Evidence Traceability',
        paragraphs: [
          'In regulated fields, developers must prove that every design claim aligns with source technical artifacts. Manual compliance mapping is highly prone to human error and demands significant engineering hours.',
          'An automated evidence traceability network that maps developer assertions to verified project documents reduces audit timeline overhead by 70%.',
          'A claims traceability graph simplifies the auditing process. By automating the extraction and linkage of developer text claims to regulatory resources, organizations can satisfy auditors and maintain velocity.'
        ]
      },
      {
        heading: '2. Oral Agreements and Communication Risks',
        paragraphs: [
          'Relying on verbal agreements without formal issue tracking leads to requirements drift. All project commitments must be logged within the sprint backlog to prevent scope deviations and deliverables mismatch.',
          'Oral agreements without tracking lead to deliverable mismatch. The lack of structured sprint logs leads to confusion and regression during final delivery.'
        ]
      }
    ]
  },
  'feedback-loop-benchmark.docx': {
    title: 'Structured Feedback Loop Benchmarks',
    subtitle: 'Comparing formal and informal communication loops',
    sections: [
      {
        heading: '1. Formal vs. Informal Communication',
        paragraphs: [
          'Formalizing communication loops through structured meetings (e.g. Sprint Review, Retrospectives) guarantees alignment. Informal feedback loops create information silos and misaligned priorities.',
          'Teams adopting structured feedback structures solve development blockages 3x faster than control groups.'
        ]
      }
    ]
  },
  'agile-audit-checklist.pdf': {
    title: 'Agile Practice Audit Checklist',
    subtitle: 'Operational checklist for scrum teams compliance review',
    sections: [
      {
        heading: '1. Verification Requirements',
        paragraphs: [
          'This checklist establishes criteria for reviewing team compliance: (a) Daily standups occur regularly, (b) Retrospectives result in actionable improvements, (c) Backlog items are trace-linked to technical files, (d) Code reviews are enforced before merges.'
        ]
      }
    ]
  }
};

export default function FileViewerModal({ fileUrl, fileName, onClose }) {
  const [loadError, setLoadError] = useState(false);
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${api.defaults.baseURL}${fileUrl}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'document';
    link.click();
  };

  const renderMockPreview = (doc) => {
    return (
      <div className="w-full h-full overflow-y-auto p-8 bg-slate-100 flex justify-center custom-scrollbar">
        <div className="bg-white shadow-lg w-[680px] min-h-[880px] p-12 text-left font-serif text-slate-800 flex flex-col justify-between rounded-sm">
          <div>
            {/* Header info */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Evidence Source Document</span>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{doc.title}</h1>
              {doc.subtitle && <p className="text-xs text-slate-500 mt-1 italic">{doc.subtitle}</p>}
            </div>
            
            {/* Body content */}
            <div className="space-y-6">
              {doc.sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">{section.heading}</h3>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-xs text-slate-600 leading-relaxed text-justify mb-3 pl-2 border-l border-slate-200">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer info */}
          <div className="border-t border-slate-100 pt-4 mt-8 flex justify-between items-center text-[9px] text-slate-400 font-sans">
            <span>Evidence Pilot - Verified Source Archive</span>
            <span>Document ID: SRC-MOCK-${fileName.replace(/\.[^/.]+$/, "").toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="font-bold text-gray-800 truncate text-sm max-w-[70%]">
            {fileName || 'File Viewer'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-gray-100 relative">
          {MOCK_DOCUMENTS[fileName] ? (
            renderMockPreview(MOCK_DOCUMENTS[fileName])
          ) : loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8">
              <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414a1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="font-medium mb-1">Preview not available</p>
              <p className="text-sm text-gray-400 mb-4">Your browser may not support inline preview for this file type.</p>
              <button
                onClick={handleDownload}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
              >
                Download File
              </button>
            </div>
          ) : (
            <iframe
              src={fullUrl}
              title={fileName || 'File Preview'}
              className="w-full h-full border-0"
              onError={() => setLoadError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
