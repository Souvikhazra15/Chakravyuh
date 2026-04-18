import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, CheckCircle, Zap, Brain, AlertCircle, TrendingUp, Users } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white dark:bg-gray-900 shadow-lg dark:shadow-2xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SchoolAI
            </div>
            <div className="hidden md:flex gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition">Features</a>
              <a href="#workflow" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition">How It Works</a>
              <a href="#usecases" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition">Use Cases</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                Get Started
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen pt-20 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-300 dark:bg-blue-600 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 dark:bg-purple-600 opacity-20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI-Powered Infrastructure Management</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Prevent School Infrastructure Failures{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 dark:from-blue-400 dark:via-purple-400 dark:to-teal-400 bg-clip-text text-transparent">
                Before They Happen
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              An AI-powered system that predicts plumbing, electrical, and structural failures 30–60 days in advance using simple weekly inputs from school staff.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transition transform hover:scale-105">
                View Demo
              </button>
              <button className="px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
                Get Started <ArrowRight className="inline ml-2" size={20} />
              </button>
            </div>
            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Trusted by education departments across</p>
              <div className="flex justify-center gap-12 text-gray-600 dark:text-gray-400 font-semibold">
                <span>Gujarat</span>
                <span>•</span>
                <span>30,000+ Schools</span>
                <span>•</span>
                <span>2M+ Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why This Matters</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">The current reality in Indian government schools</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: '30,000+', label: 'Government school buildings in Gujarat', icon: '🏫' },
              { number: 'Reactive', label: 'Current repair approach causes disruptions to learning', icon: '⚠️' },
              { number: 'Direct Impact', label: 'Infrastructure failures affect 2M+ students daily', icon: '👥' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl border border-blue-100 dark:border-gray-700 hover:shadow-lg transition">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                  {item.number}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Everything you need to prevent infrastructure failures</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <AlertCircle className="w-8 h-8" />,
                title: 'Weekly 2-Minute Reporting',
                desc: 'Dropdown-based structured form with optional photo upload for quick condition updates',
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Category-Specific Prediction',
                desc: 'Separate tracking for plumbing, electrical, and structural risks with accuracy',
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'Explainable AI',
                desc: 'Shows WHY a failure is predicted—no black-box decisions, full transparency',
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: '30–60 Day Prediction',
                desc: 'Predicts risk timeline before critical failure occurs on campus',
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: 'Smart Prioritization',
                desc: 'Girls\' toilet issues ranked higher than storage room damage automatically',
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'District-Level Dashboard',
                desc: 'DEO sees prioritized maintenance queue instead of overwhelming alerts',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer"
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Simple workflow for complex problem</p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-full"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
              {[
                { num: '01', title: 'Staff Reports', desc: 'Weekly condition submission' },
                { num: '02', title: 'System Analyzes', desc: 'Trends + building data' },
                { num: '03', title: 'AI Predicts', desc: 'Failure timeline detection' },
                { num: '04', title: 'Prioritizes', desc: 'Based on student impact' },
                { num: '05', title: 'DEO Assigns', desc: 'Contractor assignment' },
                { num: '06', title: 'Completion Proof', desc: 'Work verification upload' },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                    {step.num}
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-24 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built For Everyone</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Different roles, one unified solution</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                role: 'School Staff',
                icon: '👨‍🏫',
                desc: 'Simple 2-minute weekly reports to keep campus safe',
              },
              {
                role: 'Principal',
                icon: '🎓',
                desc: 'Real-time maintenance visibility for campus operations',
              },
              {
                role: 'District Education Officer (DEO)',
                icon: '📊',
                desc: 'Prioritized maintenance queue across 1000+ schools',
              },
              {
                role: 'Contractor',
                icon: '🔧',
                desc: 'Smart work assignments with AI-prioritized task list',
              },
            ].map((usecase, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition">
                <div className="text-4xl mb-4">{usecase.icon}</div>
                <h3 className="text-lg font-bold mb-2">{usecase.role}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{usecase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech/Logic Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 dark:from-blue-900 dark:via-purple-900 dark:to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Intelligent Technology</h2>
            <p className="text-xl text-blue-100 dark:text-blue-200">Simple yet powerful AI logic</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Trend-Based Scoring',
                desc: 'Analyzes patterns over time to detect deterioration trajectories',
                icon: '📈',
              },
              {
                title: 'Category-Wise Risk Tracking',
                desc: 'Independent models for plumbing, electrical, structural risks',
                icon: '🎯',
              },
              {
                title: 'Learning From Repairs',
                desc: 'Improves predictions with every maintenance completion record',
                icon: '🧠',
              },
            ].map((tech, idx) => (
              <div key={idx} className="bg-white bg-opacity-10 dark:bg-opacity-20 backdrop-blur p-8 rounded-xl border border-white border-opacity-20">
                <div className="text-4xl mb-4">{tech.icon}</div>
                <h3 className="text-xl font-bold mb-2">{tech.title}</h3>
                <p className="text-blue-100 dark:text-blue-200">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform School Maintenance?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">Join the revolution in predictive infrastructure management</p>
          <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transition transform hover:scale-105">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 dark:text-gray-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-xl font-bold text-white mb-4">SchoolAI</div>
              <p className="text-sm">Predictive maintenance for smarter schools</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 SchoolAI. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
