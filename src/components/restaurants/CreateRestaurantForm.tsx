'use client';

import React, { useState } from "react";

export default function CreateRestaurantForm({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [postcode, setPostcode] = useState("");
    const [latitude, setLatitude] = useState("");
    const [timeZone, setTimeZone] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Call API or server action to create restaurant
        alert(`Creating restaurant: ${name}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Restaurant</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Name*</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Address*</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Address"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">City</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="City"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Country</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Country"
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Postcode</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Postcode"
                            value={postcode}
                            onChange={e => setPostcode(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Latitude</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Latitude"
                            value={latitude}
                            onChange={e => setLatitude(e.target.value)}
                            type="number"
                            step="any"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Time Zone</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Time Zone (e.g. Europe/London)"
                            value={timeZone}
                            onChange={e => setTimeZone(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Phone</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            type="tel"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Email</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-1">Image URL</label>
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-gray-900"
                            placeholder="Image URL"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            type="url"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}