import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Phone, Mail, MessageCircle, AlertTriangle, Heart, Shield, Scale, ExternalLink, Clock } from 'lucide-react'

export default function HelpSupport() {
  const emergencyContacts = [
    { name: 'Police', number: '100', description: 'Immediate law enforcement assistance', icon: <Shield className="w-6 h-6 text-red-400" />, color: 'red' },
    { name: 'Ambulance', number: '102', description: 'Medical emergency services', icon: <Heart className="w-6 h-6 text-pink-400" />, color: 'pink' },
    { name: 'Fire Department', number: '101', description: 'Fire and rescue services', icon: <AlertTriangle className="w-6 h-6 text-orange-400" />, color: 'orange' },
    { name: 'Women Helpline', number: '1091', description: '24/7 support for women in distress', icon: <Shield className="w-6 h-6 text-purple-400" />, color: 'purple' },
    { name: 'Child Helpline', number: '1098', description: 'Support for children in need', icon: <Heart className="w-6 h-6 text-blue-400" />, color: 'blue' },
    { name: 'National Emergency Number', number: '112', description: 'Unified emergency helpline', icon: <Phone className="w-6 h-6 text-green-400" />, color: 'green' },
  ]

  const mentalHealthContacts = [
    { name: 'AASRA (24/7)', number: '9820466726', email: 'aasrahelpline@yahoo.com', description: 'Suicide prevention and mental health support' },
    { name: 'iCall', number: '9152987821', time: 'Mon-Sat, 8am-10pm', description: 'Counseling and psychosocial support' },
    { name: 'Vandrevala Foundation', number: '18602662345', email: 'help@vandrevalafoundation.com', description: '24/7 mental health helpline' },
    { name: 'Sneha India', number: '044-24640050', time: '24/7', description: 'Emotional support and suicide prevention' },
    { name: 'Mental Health Helpline', number: '08046110007', time: 'Mon-Sat, 8am-8pm', description: 'Professional mental health guidance' },
    { name: 'Sumaitri', number: '011-23389090', time: '2pm-10pm', description: 'Crisis intervention center' },
  ]

  const legalContacts = [
    { name: 'National Legal Services Authority (NALSA)', number: '15100', description: 'Free legal aid and services', website: 'nalsa.gov.in' },
    { name: 'National Commission for Women', number: '011-26942369', email: 'complaint-ncw@nic.in', description: 'Women\'s rights and legal support' },
    { name: 'National Commission for Protection of Child Rights', number: '1800-1213332', description: 'Child protection and legal aid' },
    { name: 'Cyber Crime Helpline', number: '1930', description: 'Report cyber crimes and fraud', website: 'cybercrime.gov.in' },
    { name: 'Anti-Ragging Helpline', number: '1800-180-5522', description: 'Report ragging incidents', website: 'antiragging.in' },
  ]

  const domesticViolenceContacts = [
    { name: 'Women Helpline (Domestic Violence)', number: '181', description: '24/7 helpline for women facing domestic violence' },
    { name: 'Protection Officer (PWDVA)', description: 'Contact your district Protection Officer', link: 'Find local officer at wcd.nic.in' },
    { name: 'One Stop Centre (OSC)', number: '181', description: 'Integrated support for women affected by violence' },
  ]

  const educationContacts = [
    { name: 'Student Counseling Services', description: 'Contact your school/college counselor', info: 'Available on campus during working hours' },
    { name: 'Anti-Sexual Harassment Committee', description: 'Internal Complaints Committee at your institution', info: 'Mandatory under POSH Act 2013' },
  ]

  const onlineResources = [
    { name: 'Ministry of Women & Child Development', url: 'https://wcd.nic.in', description: 'Government resources and schemes' },
    { name: 'National Crime Records Bureau', url: 'https://ncrb.gov.in', description: 'Crime statistics and reporting' },
    { name: 'Indian Judiciary', url: 'https://districts.ecourts.gov.in', description: 'Court information and case tracking' },
    { name: 'Central Social Welfare Board', url: 'https://cswb.gov.in', description: 'Welfare schemes and support' },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Help & Support</h1>
            <p className="text-gray-400">Emergency contacts, helplines, and resources for immediate assistance</p>
          </div>

          {/* Emergency Contacts - Most Important */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-gray-100">🚨 Emergency Contacts</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">For immediate danger or emergency, call these numbers</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border border-${contact.color}-600/30 bg-${contact.color}-900/20 p-6 hover:border-${contact.color}-500/50 transition-all backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${contact.color}-600/20 flex items-center justify-center flex-shrink-0`}>
                      {contact.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 text-gray-100">{contact.name}</h3>
                      <a href={`tel:${contact.number}`} className={`text-2xl font-bold text-${contact.color}-400 hover:text-${contact.color}-300 transition-colors`}>
                        {contact.number}
                      </a>
                      <p className="text-sm text-gray-400 mt-2">{contact.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mental Health Support */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-pink-400" />
              <h2 className="text-2xl font-bold text-gray-100">💙 Mental Health & Emotional Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {mentalHealthContacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-pink-600/30 bg-pink-900/20 p-6 hover:border-pink-500/50 transition-all backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">{contact.name}</h3>
                  <div className="space-y-2">
                    <a href={`tel:${contact.number}`} className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-lg">{contact.number}</span>
                    </a>
                    {contact.time && (
                      <p className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {contact.time}
                      </p>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-300 transition-colors">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    <p className="text-sm text-gray-400 mt-2">{contact.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Aid & Support */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-100">⚖️ Legal Aid & Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {legalContacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-blue-600/30 bg-blue-900/20 p-6 hover:border-blue-500/50 transition-all backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">{contact.name}</h3>
                  <div className="space-y-2">
                    <a href={`tel:${contact.number}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-lg">{contact.number}</span>
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition-colors">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.website && (
                      <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        {contact.website}
                      </a>
                    )}
                    <p className="text-sm text-gray-400 mt-2">{contact.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Domestic Violence Support */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-100">🛡️ Domestic Violence Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {domesticViolenceContacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-purple-600/30 bg-purple-900/20 p-6 hover:border-purple-500/50 transition-all backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">{contact.name}</h3>
                  {contact.number && (
                    <a href={`tel:${contact.number}`} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-lg">{contact.number}</span>
                    </a>
                  )}
                  <p className="text-sm text-gray-400">{contact.description}</p>
                  {contact.link && (
                    <p className="text-sm text-purple-400 mt-2">{contact.link}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Educational Institution Support */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-gray-100">🎓 Educational Institution Support</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {educationContacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-green-600/30 bg-green-900/20 p-6 hover:border-green-500/50 transition-all backdrop-blur-sm"
                >
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">{contact.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{contact.description}</p>
                  <p className="text-sm text-green-400">{contact.info}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Online Resources */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-100">🌐 Online Resources</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {onlineResources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-cyan-600/30 bg-cyan-900/20 p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-100 group-hover:text-cyan-300 transition-colors">{resource.name}</h3>
                      <p className="text-sm text-gray-400">{resource.description}</p>
                      <p className="text-sm text-cyan-400 mt-2">{resource.url}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-cyan-400 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="rounded-2xl border border-yellow-600/30 bg-yellow-900/20 p-6 backdrop-blur-sm">
            <h3 className="font-semibold text-lg mb-3 text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• All helpline numbers are free to call from any network in India</li>
              <li>• For life-threatening emergencies, always dial <strong className="text-red-400">112</strong> (National Emergency Number)</li>
              <li>• Mental health helplines provide confidential support - you don't have to share your name</li>
              <li>• Legal aid services through NALSA are completely free for eligible individuals</li>
              <li>• If you're in immediate danger, please call the police (100) or go to the nearest police station</li>
              <li>• Save these numbers in your phone for quick access during emergencies</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
