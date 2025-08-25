'use client';

import React from "react";

export default function CreateRestaurantButton() {
    return (
        <button
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700"
            onClick={() => alert('Show create restaurant form here!')}
            type="button"
        >
            + Create Restaurant
        </button>
    );
}