import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav style={{ borderBottom: '1.5px solid #e8f4f1' }} className="px-6 h-14 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div style={{ background: '#0F5C4D' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">Q</span>
          </div>
          <span style={{ color: '#0F5C4D' }} className="font-semibold">QueueCut</span>
        </div>
        <div className="flex gap-2">
          <Link href="/auth/patient/login" className="btn-outline text-sm py-1.5 px-4">Patient login</Link>
          <Link href="/auth/clinic/login" className="btn-primary text-sm py-1.5 px-4">Clinic login</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div style={{ background: '#e8f4f1', color: '#0F5C4D' }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6">
          <span>●</span> Skip the waiting room
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight max-w-xl">
          Your turn,<br /><span style={{ color: '#0F5C4D' }}>on your terms.</span>
        </h1>
        <p className="text-gray-500 text-base max-w-md mb-8 leading-relaxed">
          Book a token at any clinic, track your position in real time, and walk in right when it&apos;s your turn. No more sitting in crowded waiting rooms.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/auth/patient/signup" className="btn-primary px-6 py-2.5">Get started as patient</Link>
          <Link href="/auth/clinic/signup" className="btn-outline px-6 py-2.5">Register your clinic</Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg w-full">
          {[['Zero', 'Physical wait'], ['Real‑time', 'Queue updates'], ['One tap', 'Token booking']].map(([val, label]) => (
            <div key={label} className="text-center">
              <div style={{ color: '#0F5C4D' }} className="text-xl font-bold">{val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#f8fdfb', borderTop: '1.5px solid #e8f4f1' }} className="px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-lg font-semibold text-gray-800 mb-10">How it works</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div style={{ color: '#0F5C4D' }} className="text-xs font-semibold uppercase tracking-wider mb-3">For Patients</div>
              <div className="space-y-3">
                {['Find a nearby clinic and pick a doctor','Book your token in under 10 seconds','Watch your position update live','Walk in when you\'re called — no waiting'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div style={{ background: '#0F5C4D', minWidth: 20 }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">{i+1}</div>
                    <span className="text-sm text-gray-600">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: '#0F5C4D' }} className="text-xs font-semibold uppercase tracking-wider mb-3">For Clinics</div>
              <div className="space-y-3">
                {['Sign up and add your doctors','Patients book tokens from the app','Call next patient with one click','Mark consultation complete — done'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div style={{ background: '#0F5C4D', minWidth: 20 }} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">{i+1}</div>
                    <span className="text-sm text-gray-600">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1.5px solid #e8f4f1' }} className="py-5 text-center text-xs text-gray-400">
        © 2026 QueueCut · Built for modern clinics
      </footer>
    </main>
  )
}
