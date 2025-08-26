'use client';

import React, { useState } from 'react';

export default function CreateRestaurantForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postcode, setPostcode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          city,
          country,
          postcode,
          latitude: latitude ? parseFloat(latitude) : undefined,
          timezone: timeZone,
          phone,
          email,
          description,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert('Error: ' + (errorData.error || 'Failed to create restaurant'));
        return;
      }

      const restaurant = await res.json();
      console.log('Created restaurant:', restaurant);

      setName('');
      setAddress('');
      setCity('');
      setCountry('');
      setPostcode('');
      setLatitude('');
      setTimeZone('');
      setPhone('');
      setEmail('');
      setDescription('');
      setImageUrl('');

      onClose();
    } catch (err) {
      console.error('API call failed:', err);
      alert('An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-2xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Create Restaurant</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block font-medium text-gray-800">Name*</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Address*</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">City</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Country</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Postcode</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Latitude</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
              step="any"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Time Zone</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Time Zone (e.g. Europe/London)"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Phone</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Email</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Description</label>
            <textarea
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-gray-800">Image URL</label>
            <input
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              type="url"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
