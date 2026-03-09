import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Sparkles, Users, ShieldCheck, HeartHandshake } from 'lucide-react'

export default function About() {
  const team = [
    {
      name: 'Dr. Aarartika Pandey',
      role: 'Assistant Professor, School of Law (Mentor)',
      bio:
        "Guidance on AI ethics, legal compliance, and comprehensive system review. Instrumental in shaping Rakshak's responsible approach to sensitive cases.",
    },
    {
      name: 'Shubham Rathore',
      role: 'Team Lead · Development · Strategy',
      bio: 'Leads architecture, backend integrations, and roadmap execution.',
    },
    { name: 'Dhruv', role: 'Research · Content · Testing', bio: 'Legal/mental health research and QA workflows.' },
    { name: 'Manish', role: 'Design · User Experience', bio: 'Interface, accessibility, and motion design.' },
    { name: 'Priyanshu Singh', role: 'Documentation · Evaluation', bio: 'Technical docs, demos, and evaluation frameworks.' },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">About Rakshak</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Empathy + Law, Powered by AI</h1>
            <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
              Rakshak merges compassionate emotional support with Indian legal information, enabling students to report
              safely, get concise guidance, and collaborate with teachers and administrators.
            </p>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-cyan-600/40 transition">
              <ShieldCheck className="w-6 h-6 text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Privacy First</h3>
              <p className="text-gray-400 text-sm">Row-Level Security, PII redaction, and secure evidence storage.</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-blue-600/40 transition">
              <Users className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Role-Based</h3>
              <p className="text-gray-400 text-sm">Student, Teacher, and Root dashboards with targeted workflows.</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-pink-600/40 transition">
              <HeartHandshake className="w-6 h-6 text-pink-400 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Concise Support</h3>
              <p className="text-gray-400 text-sm">AI assistant replies in 1–2 sentences for clarity.</p>
            </div>
          </div>

          {/* Team */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Team Members</h2>
            <p className="text-gray-400 mb-6 text-sm">Faces intentionally blurred in demos; names and roles below.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:border-cyan-600/40 transition group"
              >
                <div className="h-36 rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 mb-4 group-hover:from-cyan-900/40 group-hover:to-gray-800" />
                <h3 className="text-lg font-semibold text-gray-100">{member.name}</h3>
                <p className="text-cyan-300 text-sm font-medium mt-1">{member.role}</p>
                <p className="text-gray-400 text-sm mt-3">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
