"use client";
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    comments: '',
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbzLfDB7oDZlKP6y4_Ys9IfBVyNr66uqklmZ4lxu-j4Il466tXM0JRpsFzSCFzaqwRU/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ firstName: '', lastName: '', businessName: '', email: '', phone: '', comments: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Contact Us</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="w-1/2 rounded border px-3 py-2"
          />
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="w-1/2 rounded border px-3 py-2"
          />
        </div>
        <input
          name="businessName"
          value={form.businessName}
          onChange={handleChange}
          placeholder="Business Name"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full rounded border px-3 py-2"
        />
        <textarea
          name="comments"
          value={form.comments}
          onChange={handleChange}
          placeholder="Comments"
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Sending...' : 'Send'}
        </button>
        {status === 'success' && <p className="text-green-600">Thank you! Your message was sent.</p>}
        {status === 'error' && <p className="text-red-600">Error sending message. Please try again.</p>}
      </form>
    </div>
  );
}
