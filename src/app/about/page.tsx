"use client";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-blue-700">
        About RDA{" "}
        <span className="text-gray-500">(Reuse | Deliver | Appetize)</span>
      </h1>
      <div className="rounded-xl bg-white/80 shadow-lg p-6 mb-8 border border-gray-100">
        <p className="text-lg text-gray-700 mb-4">
          At{" "}
          <span className="font-semibold text-blue-700">
            RDA (Reuse | Deliver | Appetize)
          </span>
          , we believe that food should never go to waste. Every year, tons of
          perfectly good food end up discarded, while countless people and
          organizations could benefit from it. That’s why we built RDA — a smart,
          intuitive platform designed to help businesses, communities, and
          individuals track, manage, and repurpose surplus food with ease.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>
            Monitor and reduce food waste with real-time tracking and reporting.
          </li>
          <li>Redistribute surplus food to charities, partners, or secondary markets.</li>
          <li>Save money and resources while reducing your environmental footprint.</li>
        </ul>
        <p className="text-lg text-gray-700 mb-4">
          Our mission is simple but powerful: to make reducing food waste simple,
          measurable, and impactful. Whether you’re a restaurant, retailer,
          caterer, or community organization, RDA gives you the tools to turn
          food waste into opportunities — for savings, for growth, and for a
          better planet.
        </p>
        <p className="text-lg text-blue-700 font-semibold">
          Together, we can create a future where every meal counts.
        </p>
      </div>
    </div>
  );
}
