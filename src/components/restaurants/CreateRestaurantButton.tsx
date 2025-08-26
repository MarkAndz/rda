'use client';

import React, { useState } from 'react';
import CreateRestaurantForm from './CreateRestaurantForm';

export default function CreateRestaurantButton() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        className="rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700"
        onClick={() => setShowForm(true)}
        type="button"
      >
        + Create Restaurant
      </button>
      {showForm && <CreateRestaurantForm onClose={() => setShowForm(false)} />}
    </>
  );
}
